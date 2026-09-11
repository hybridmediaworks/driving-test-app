<?php

use App\Models\Quiz;
use App\Models\QuizType;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Fills in the time limits that were never set. Every quiz type already uses exactly one
     * duration where it has been filled in — practice tests 1800s, exam simulations 600s — but
     * most rows were left null, so the test pages had no time limit to show and the player ran
     * those attempts untimed.
     *
     * The value isn't hardcoded: for each type it takes the duration that type's own populated
     * quizzes already use, and applies it to that type's empty ones. A type with no populated
     * quiz to learn from is skipped rather than guessed at.
     */
    public function up(): void
    {
        foreach (QuizType::query()->pluck('id') as $typeId) {
            $duration = Quiz::query()
                ->where('quiz_type_id', $typeId)
                ->whereNotNull('duration_seconds')
                ->selectRaw('duration_seconds, count(*) as total')
                ->groupBy('duration_seconds')
                ->reorder('total', 'desc')
                ->value('duration_seconds');

            if ($duration === null) {
                continue;
            }

            Quiz::query()
                ->where('quiz_type_id', $typeId)
                ->whereNull('duration_seconds')
                ->update(['duration_seconds' => $duration]);
        }
    }

    /**
     * Not reversible: which rows were null before is not recorded anywhere, so clearing them
     * again would wipe the durations that were deliberately set too.
     */
    public function down(): void {}
};
