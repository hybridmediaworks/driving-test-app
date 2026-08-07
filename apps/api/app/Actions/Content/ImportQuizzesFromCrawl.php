<?php

namespace App\Actions\Content;

use App\Actions\Quiz\GenerateUniqueSlug;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizCategory;
use App\Models\QuizQuestion;
use App\Models\QuizType;
use App\Models\State;
use App\Models\VehicleType;
use App\Support\ImportSummary;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

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
    /** @var array<string, string> url -> local temp file path, reused across questions/quizzes in one run */
    private array $imageCache = [];

    public function __construct(
        private readonly GenerateUniqueSlug $generateUniqueSlug,
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
            $category = $this->upsertCategory($section['title'] ?? '', $sectionIndex, $state, $vehicleType, $testTrack, $summary);
            if ($category === null) {
                continue;
            }

            foreach ($section['subcategories'] ?? [] as $subcategory) {
                $quizType = $this->resolveQuizType($category->title, (string) ($subcategory['title'] ?? ''));
                $this->importQuiz($subcategory, $state, $vehicleType, $testTrack, $category, $quizType, $summary, $dryRun);
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
            $category = $this->upsertCategory($groupLabel, $sectionIndex, $state, $vehicleType, $testTrack, $summary);
            $sectionIndex++;
            if ($category === null) {
                continue;
            }

            foreach ($rows as $subcategory) {
                $quizType = $this->resolveQuizType($category->title, (string) ($subcategory['title'] ?? ''));
                $this->importQuiz($subcategory, $state, $vehicleType, $testTrack, $category, $quizType, $summary, $dryRun);
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

        if ($dryRun) {
            $summary->increment('quizzes.would_import');

            return;
        }

        $slug = $this->generateUniqueSlug->__invoke(
            'quizzes',
            "{$state->code} {$vehicleType->name} {$title}",
        );

        $quiz = Quiz::query()->updateOrCreate(
            ['state_id' => $state->id, 'vehicle_type_id' => $vehicleType->id, 'title' => $title, 'test_track' => $testTrack],
            [
                'quiz_category_id' => $category->id,
                'quiz_type_id' => $quizType?->id,
                'title' => $title,
                'slug' => $slug,
                'source_url' => $subcategory['url'] ?? null,
                'is_premium' => $tier === 'PREMIUM',
                'is_active' => true,
            ],
        );
        $summary->increment($quiz->wasRecentlyCreated ? 'quizzes.created' : 'quizzes.updated');

        // Individual model deletes (not a bulk query delete) so Spatie's deleting-model media
        // cleanup actually fires — a bulk ->delete() on the relation skips model events entirely.
        $quiz->quizQuestions()->get()->each(fn (QuizQuestion $question) => $question->delete());

        foreach ($subcategory['questions'] ?? [] as $questionRow) {
            $this->importQuestion($questionRow, $quiz, $summary);
        }

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

        foreach ($options as $index => $optionText) {
            QuizAnswer::query()->create([
                'quiz_question_id' => $question->id,
                'answer_text' => (string) $optionText,
                'is_correct' => $index === $answerIndex,
                'sort_order' => $index,
            ]);
        }

        foreach (array_filter((array) ($row['question_images'] ?? [])) as $url) {
            $this->attachImage($question, (string) $url, $summary);
        }
    }

    private function attachImage(QuizQuestion $question, string $url, ImportSummary $summary): void
    {
        try {
            if (! isset($this->imageCache[$url])) {
                $response = Http::timeout(15)->get($url);
                if (! $response->successful()) {
                    $summary->warn("Image fetch failed ({$response->status()}): {$url}");

                    return;
                }

                $extension = pathinfo(parse_url($url, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION) ?: 'jpg';
                $tempPath = tempnam(sys_get_temp_dir(), 'qimg_').'.'.$extension;
                File::put($tempPath, $response->body());
                $this->imageCache[$url] = $tempPath;
            }

            $question->addMedia($this->imageCache[$url])
                ->preservingOriginal()
                ->withCustomProperties(['source_url' => $url])
                ->toMediaCollection(QuizQuestion::MEDIA_COLLECTION_IMAGES);
            $summary->increment('question_images.attached');
        } catch (Throwable $e) {
            $summary->warn("Image attach failed for {$url}: {$e->getMessage()}");
        }
    }

    public function __destruct()
    {
        foreach ($this->imageCache as $path) {
            if (File::exists($path)) {
                File::delete($path);
            }
        }
    }
}
