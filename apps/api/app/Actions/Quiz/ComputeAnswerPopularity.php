<?php

namespace App\Actions\Quiz;

use App\Models\QuizQuestion;

class ComputeAnswerPopularity
{
    /**
     * What percentage of completed quiz attempts picked each answer option, from
     * `quiz_attempt_answers` — the practice-mode `check` endpoint is stateless and never
     * contributes here, so a learner's own in-progress answer never biases the number they're
     * shown for it. Returns null (not an empty/zero-filled array) when no attempt has ever been
     * submitted for this question yet, same "honest null" convention as `Quiz::passRate()`.
     *
     * @return list<array{answer_id: int, percentage: int}>|null
     */
    public function __invoke(QuizQuestion $question): ?array
    {
        $counts = $question->attemptAnswers()
            ->whereNotNull('quiz_answer_id')
            ->selectRaw('quiz_answer_id, count(*) as total')
            ->groupBy('quiz_answer_id')
            ->pluck('total', 'quiz_answer_id');

        $total = $counts->sum();
        if ($total === 0) {
            return null;
        }

        return $counts
            ->map(fn ($count, $answerId) => [
                'answer_id' => (int) $answerId,
                'percentage' => (int) round($count / $total * 100),
            ])
            ->values()
            ->all();
    }
}
