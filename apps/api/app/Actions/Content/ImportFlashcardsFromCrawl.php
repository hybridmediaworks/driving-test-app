<?php

namespace App\Actions\Content;

use App\Models\Flashcard;
use App\Models\QuizCategory;
use App\Models\State;
use App\Models\VehicleType;
use App\Support\ImportSummary;
use Illuminate\Support\Facades\DB;

/**
 * Imports one "Flashcard Set" from a crawled questions.json section.
 *
 * The source lists these alongside the practice tests (they only appear on driving-tests.org once
 * you're signed in), but they are not tests: every row carries `options: []`, `answer_index: -1`
 * and the real text in `answer` — a front/back card, not a multiple-choice question. Importing them
 * as quizzes dropped all 44,075 of them as "malformed", so they go to `flashcards` instead, which
 * already has the exact front_text/back_text/state/vehicle/category shape they need.
 *
 * Detection is by shape, not by the "Flashcard Set" title, so a set the source renames still lands
 * in the right table. See {@see self::looksLikeFlashcardSet()}.
 */
class ImportFlashcardsFromCrawl
{
    /**
     * True when a subcategory's rows are cards rather than questions — no options anywhere, but at
     * least one real answer to put on the back.
     */
    public static function looksLikeFlashcardSet(array $subcategory): bool
    {
        $rows = $subcategory['questions'] ?? [];
        if ($rows === []) {
            return false;
        }

        $answered = 0;
        foreach ($rows as $row) {
            if (($row['options'] ?? []) !== []) {
                return false;
            }
            if (trim((string) ($row['answer'] ?? '')) !== '') {
                $answered++;
            }
        }

        return $answered > 0;
    }

    public function __invoke(
        array $subcategory,
        State $state,
        VehicleType $vehicleType,
        QuizCategory $category,
        bool $isPremium,
        ImportSummary $summary,
        bool $dryRun,
    ): void {
        $title = trim((string) ($subcategory['title'] ?? ''));
        if ($title === '') {
            $summary->warn("Skipped a flashcard set with no title ({$state->name}/{$vehicleType->name}).");

            return;
        }

        if ($dryRun) {
            $summary->increment('flashcard_sets.would_import');

            return;
        }

        // The set is identified by its topic (its own title) within this state/vehicle/category,
        // so a re-import replaces its cards instead of stacking a second copy of them.
        $scope = [
            'state_id' => $state->id,
            'vehicle_type_id' => $vehicleType->id,
            'quiz_category_id' => $category->id,
            'topic' => $title,
        ];

        DB::transaction(function () use ($subcategory, $scope, $isPremium, $summary) {
            Flashcard::query()->where($scope)->get()->each(fn (Flashcard $card) => $card->delete());

            $sortOrder = 0;
            foreach ($subcategory['questions'] ?? [] as $row) {
                $front = trim((string) ($row['question'] ?? ''));
                $back = trim((string) ($row['answer'] ?? ''));

                if ($front === '' || $back === '') {
                    $summary->increment('flashcards.skipped_incomplete');

                    continue;
                }

                Flashcard::query()->create($scope + [
                    'front_text' => mb_substr($front, 0, 500),
                    'back_text' => $back,
                    'is_premium' => $isPremium,
                    'is_active' => true,
                    'sort_order' => ++$sortOrder,
                ]);
                $summary->increment('flashcards.created');
            }
        });

        $summary->increment('flashcard_sets.imported');
    }
}
