<?php

namespace App\Actions\Quiz;

use App\Models\QuizQuestion;

class GradeSingleAnswer
{
    /**
     * Grade one question against a submitted answer id.
     *
     * `is_correct` is true only when the selected answer belongs to the question AND its
     * `is_correct` flag is set — an answer id from another question resolves to null and is
     * treated as incorrect. The question's `answers` relation must be loaded by the caller.
     *
     * @return array{selected_answer_id: int|null, correct_answer_id: int|null, is_correct: bool}
     */
    public function __invoke(QuizQuestion $question, ?int $answerId): array
    {
        $answer = $answerId !== null ? $question->answers->firstWhere('id', $answerId) : null;
        $correct = $question->answers->firstWhere('is_correct', true);

        return [
            'selected_answer_id' => $answer?->id,
            'correct_answer_id' => $correct?->id,
            'is_correct' => $answer !== null && $answer->is_correct,
        ];
    }
}
