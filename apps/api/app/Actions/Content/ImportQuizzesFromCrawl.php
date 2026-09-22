<?php

namespace App\Actions\Content;

use App\Actions\Quiz\GenerateUniqueSlug;
use App\Enums\QuizQuestionAssetType;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizCategory;
use App\Models\QuizQuestion;
use App\Models\QuizQuestionAsset;
use App\Models\QuizType;
use App\Models\State;
use App\Models\VehicleType;
use App\Support\ImportSummary;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Imports one questions.json file. Confirmed against real Alabama/Alaska data, the source uses
 * **two different shapes** depending on test track:
 *
 * - Permit Test: `sections[]` is a category wrapper — `{title, subcategories: [{title, url,
 *   tier, questions}]}`. Each `subcategories[]` entry is one Quiz.
 * - Driving Test: `sections[]` is already flat — `{section, title, url, tier, questions}`. Each
 *   entry IS one Quiz directly; `section` (not `title`) is the broader grouping label, matching
 *   the same `section`/`title` convention videos.json and simulators.json already use.
 *
 * Both shapes are detected (not passed as a flag) since a single questions.json only ever uses
 * one, and this keeps the command's call site agnostic to the distinction.
 * See docs/PHASE_3_CONTENT_PLATFORM.md "Ingestion pipeline".
 */
class ImportQuizzesFromCrawl
{
    public function __construct(
        private readonly GenerateUniqueSlug $generateUniqueSlug,
        private readonly ImportFlashcardsFromCrawl $importFlashcards,
    ) {}

    public function __invoke(
        array $data,
        State $state,
        VehicleType $vehicleType,
        string $testTrack,
        ImportSummary $summary,
        bool $dryRun,
    ): void {
        $sections = $data['sections'] ?? [];
        if ($sections === []) {
            return;
        }

        if (array_key_exists('subcategories', $sections[0])) {
            $this->importNestedShape($sections, $state, $vehicleType, $testTrack, $summary, $dryRun);
        } else {
            $this->importFlatShape($sections, $state, $vehicleType, $testTrack, $summary, $dryRun);
        }
    }

    private function importNestedShape(
        array $sections,
        State $state,
        VehicleType $vehicleType,
        string $testTrack,
        ImportSummary $summary,
        bool $dryRun,
    ): void {
        foreach ($sections as $sectionIndex => $section) {
            $category = $this->upsertCategory($section['title'] ?? '', $sectionIndex, $state, $vehicleType, $testTrack, $summary, $dryRun);
            if ($category === null) {
                continue;
            }

            foreach (array_values($section['subcategories'] ?? []) as $position => $subcategory) {
                $quizType = $this->resolveQuizType($category->title, (string) ($subcategory['title'] ?? ''));
                $this->importQuiz($subcategory, $state, $vehicleType, $testTrack, $category, $quizType, $summary, $dryRun, $position);
            }
        }
    }

    /**
     * Groups the flat rows by their own `section` field (preserving first-seen order) — each
     * group becomes one quiz_category, each row within it one Quiz, reusing importQuiz()
     * unchanged since a flat row already has the same title/url/tier/questions shape as a
     * nested subcategory entry.
     */
    private function importFlatShape(
        array $sections,
        State $state,
        VehicleType $vehicleType,
        string $testTrack,
        ImportSummary $summary,
        bool $dryRun,
    ): void {
        $grouped = [];
        foreach ($sections as $row) {
            $groupLabel = trim((string) ($row['section'] ?? '')) ?: 'General';
            $grouped[$groupLabel][] = $row;
        }

        $sectionIndex = 0;
        foreach ($grouped as $groupLabel => $rows) {
            $category = $this->upsertCategory($groupLabel, $sectionIndex, $state, $vehicleType, $testTrack, $summary, $dryRun);
            $sectionIndex++;
            if ($category === null) {
                continue;
            }

            foreach (array_values($rows) as $position => $subcategory) {
                $quizType = $this->resolveQuizType($category->title, (string) ($subcategory['title'] ?? ''));
                $this->importQuiz($subcategory, $state, $vehicleType, $testTrack, $category, $quizType, $summary, $dryRun, $position);
            }
        }
    }

    private function upsertCategory(
        string $sectionTitle,
        int $sectionIndex,
        State $state,
        VehicleType $vehicleType,
        string $testTrack,
        ImportSummary $summary,
        bool $dryRun,
    ): ?QuizCategory {
        $sectionTitle = trim($sectionTitle);
        if ($sectionTitle === '') {
            $summary->warn("Skipped a section with no title ({$state->name}/{$vehicleType->name}/{$testTrack}).");

            return null;
        }

        if (Str::contains(Str::lower($sectionTitle), ['does not include premium access', 'membership plan'])) {
            // Confirmed via driving-tests.org/alabama/motorcycle/ and driving-tests.org/alaska/motorcycle/
            // (both live-checked): the scraper hits a login wall on the *first* practice-test
            // section of the motorcycle permit page, capturing the site's paywall message as the
            // section heading instead of the real one. The real heading — "Practice Essential
            // Topics" — is recoverable because it's the literal title of the very next section in
            // the same file, which the scraper *did* capture correctly (same "Practice Test N..."
            // quiz-title sequence, just continuing the numbering). Substituting it here means the
            // two sections merge into one real category via firstOrCreate below, instead of a raw
            // scraper error string ever reaching a user-facing quiz category name.
            $summary->warn("Data-quality artifact section title \"{$sectionTitle}\" ({$state->name}/{$vehicleType->name}/{$testTrack}) — substituted with the verified real heading \"Practice Essential Topics\".");
            $sectionTitle = 'Practice Essential Topics';
        }

        if ($dryRun) {
            // A dry run must not write: report what would happen and hand back an unsaved model
            // (importQuiz only reads ->title before its own dry-run early return).
            $category = QuizCategory::query()->where('name', Str::slug($sectionTitle))->first();
            $summary->increment($category === null ? 'quiz_categories.would_create' : 'quiz_categories.reused');

            return $category ?? new QuizCategory(['title' => $sectionTitle]);
        }

        $category = QuizCategory::query()->firstOrCreate(
            ['name' => Str::slug($sectionTitle)],
            ['title' => $sectionTitle, 'order_no' => $sectionIndex, 'is_active' => true],
        );
        $summary->increment($category->wasRecentlyCreated ? 'quiz_categories.created' : 'quiz_categories.reused');

        return $category;
    }

    /**
     * Checks the quiz's own title, not just its category: confirmed against the real motorcycle
     * data (both Alabama and Alaska) that the crawler sometimes merges two distinct real site
     * headings — e.g. "Practice Fines & Limits and Pass the Marathon" and "Pass Exam Simulator"
     * — into a single JSON section, so a category-title-only check misses an exam-simulator quiz
     * sharing a section with non-simulator quizzes. Every real "DMV Exam Simulator" quiz title
     * seen in the source data says so explicitly, making the title-level check reliable.
     */
    private function resolveQuizType(string $categoryTitle, string $quizTitle): ?QuizType
    {
        $isExamSimulator = Str::contains(Str::lower($categoryTitle), 'exam simulator')
            || Str::contains(Str::lower($quizTitle), 'exam simulator');

        return QuizType::query()->where('name', $isExamSimulator ? 'final' : 'practice')->first();
    }

    private function importQuiz(
        array $subcategory,
        State $state,
        VehicleType $vehicleType,
        string $testTrack,
        QuizCategory $category,
        ?QuizType $quizType,
        ImportSummary $summary,
        bool $dryRun,
        int $position,
    ): void {
        $title = trim((string) ($subcategory['title'] ?? ''));
        if ($title === '') {
            $summary->warn("Skipped a quiz with no title in category \"{$category->title}\" ({$state->name}/{$vehicleType->name}).");

            return;
        }

        $tier = strtoupper((string) ($subcategory['tier'] ?? ''));
        if (! in_array($tier, ['PREMIUM', 'FREE'], true)) {
            $summary->warn("Unexpected tier value \"{$tier}\" for quiz \"{$title}\" — defaulting to premium.");
        }

        // The source lists flashcard sets in the same sections as the tests, but they are cards,
        // not multiple-choice questions — they belong in `flashcards`, not `quizzes`.
        if (ImportFlashcardsFromCrawl::looksLikeFlashcardSet($subcategory)) {
            ($this->importFlashcards)($subcategory, $state, $vehicleType, $category, $tier === 'PREMIUM', $summary, $dryRun);

            return;
        }

        if ($dryRun) {
            $summary->increment('quizzes.would_import');

            return;
        }

        $key = ['state_id' => $state->id, 'vehicle_type_id' => $vehicleType->id, 'title' => $title, 'test_track' => $testTrack];

        // Keep the slug a quiz was first imported with. Generating one unconditionally meant a
        // re-import saw its own existing slug as "taken" and rewrote the row to `...-1`, then
        // `...-2` — every re-run silently churned every public quiz URL.
        $existing = Quiz::query()->where($key)->first(['id', 'slug', 'order_no']);
        $slug = $existing?->slug
            ?? $this->generateUniqueSlug->__invoke('quizzes', "{$state->code} {$vehicleType->name} {$title}");

        // Position within its section in the source file — the order the site itself lists the
        // tests in (Test 1..13, then Marathon, then Exam Simulator). Without it every imported
        // quiz sits at order_no 0 and the ladder falls back to sorting by title, which reads
        // "Test 10, Test 11, Test 2" and puts the marathon first. Only set on create so a hand-
        // tuned order in /admin/quizzes survives a re-import. `?:` not `??` — the column is
        // non-nullable default 0, so 0 is the "never ordered" value that needs backfilling.
        $orderNo = $existing?->order_no ?: $position + 1;

        $quiz = Quiz::query()->updateOrCreate(
            $key,
            [
                'quiz_category_id' => $category->id,
                'quiz_type_id' => $quizType?->id,
                'title' => $title,
                'slug' => $slug,
                'order_no' => $orderNo,
                'source_url' => $subcategory['url'] ?? null,
                'is_premium' => $tier === 'PREMIUM',
                'is_active' => true,
            ],
        );
        $summary->increment($quiz->wasRecentlyCreated ? 'quizzes.created' : 'quizzes.updated');

        $oldQuestions = $quiz->quizQuestions()->with('media')->get();

        // One commit per quiz rather than one per row: with innodb_flush_log_at_trx_commit=1 the
        // per-row fsync, not the work itself, was the import's bottleneck. The wipe belongs inside
        // it too — committed separately, a failed re-import left the quiz with zero questions.
        DB::transaction(function () use ($subcategory, $quiz, $oldQuestions, $summary) {
            // Rows only: Spatie's deleting-model hook would unlink the image FILES here, and a
            // rollback cannot put those back — it would restore the questions pointing at images
            // already gone. The files go below, once the re-import has actually committed.
            $oldQuestions->each(fn (QuizQuestion $question) => $question->deletePreservingMedia());

            foreach ($subcategory['questions'] ?? [] as $questionRow) {
                $this->importQuestion($questionRow, $quiz, $summary);
            }
        });

        // Individual model deletes (not a bulk query delete) so Spatie's deleting-media hook fires
        // and takes the file and its conversions with the row.
        $oldQuestions->each(fn (QuizQuestion $question) => $question->media->each->delete());

        $quiz->syncTotalQuestions();
    }

    private function importQuestion(array $row, Quiz $quiz, ImportSummary $summary): void
    {
        $questionText = trim((string) ($row['question'] ?? ''));
        $options = $row['options'] ?? [];
        $answerIndex = $row['answer_index'] ?? null;
        $questionNumber = $row['question_number'] ?? '?';

        if ($questionText === '' || ! is_array($options) || count($options) === 0 || ! is_int($answerIndex)) {
            $summary->warn("Skipped a malformed question in quiz \"{$quiz->title}\" (question #{$questionNumber}).");

            return;
        }

        if (! array_key_exists($answerIndex, $options)) {
            $summary->warn("answer_index {$answerIndex} out of range for quiz \"{$quiz->title}\" question #{$questionNumber} — skipped.");

            return;
        }

        if (isset($row['answer']) && trim((string) $row['answer']) !== trim((string) $options[$answerIndex])) {
            $summary->warn("Answer text/index mismatch on quiz \"{$quiz->title}\" question #{$questionNumber} — trusted answer_index.");
        }

        $topic = trim((string) ($row['subcategory'] ?? ''));
        $explanation = trim((string) ($row['explanation'] ?? ''));

        $question = QuizQuestion::query()->create([
            'quiz_id' => $quiz->id,
            'question_text' => $questionText,
            'explanation' => $explanation === '' ? null : $explanation,
            // No difficulty signal anywhere in the source data — defaulted, not guessed as real.
            'difficulty' => 'medium',
            'topic' => $topic === '' ? null : $topic,
            'sort_order' => $row['question_number'] ?? 0,
        ]);
        $summary->increment('quiz_questions.created');

        $now = now();
        QuizAnswer::query()->insert(array_map(fn ($index, $optionText) => [
            'quiz_question_id' => $question->id,
            'answer_text' => (string) $optionText,
            'is_correct' => $index === $answerIndex,
            'sort_order' => $index,
            'created_at' => $now,
            'updated_at' => $now,
        ], array_keys($options), $options));

        // Images are referenced, not copied. The source draws on a few hundred stock images
        // across hundreds of thousands of questions (CDL: 122,301 references, 696 distinct
        // files), and Spatie stores one file per reference — ~17GB for CDL, for 96MB of actual
        // pictures. A `lottie`/`image` asset row holding the source URL costs nothing, and
        // QuizQuestion::$image_urls folds them in alongside any self-hosted media.
        foreach (array_filter((array) ($row['question_images'] ?? [])) as $index => $url) {
            $url = (string) $url;
            $extension = Str::lower(pathinfo(parse_url($url, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION));

            // "Road situation" questions link a Lottie vector animation (Bodymovin JSON —
            // v/fr/ip/op/layers/assets schema) rather than a raster image; they have always been
            // kept as asset rows, and now the raster images are too.
            $isLottie = $extension === 'json';

            QuizQuestionAsset::query()->create([
                'quiz_question_id' => $question->id,
                'type' => $isLottie ? QuizQuestionAssetType::Lottie : QuizQuestionAssetType::Image,
                'external_url' => $url,
                'sort_order' => $index,
            ]);
            $summary->increment($isLottie ? 'question_assets.lottie_created' : 'question_assets.image_created');
        }
    }
}
