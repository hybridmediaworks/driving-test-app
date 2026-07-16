<?php

namespace App\Actions\Quiz;

use App\Models\QuizQuestion;

class SyncQuizQuestionAnswers
{
    /**
     * @param  list<array{answer_text: string, explanation?: string|null, is_correct: bool}>  $answers
     */
    public function __invoke(QuizQuestion $question, array $answers): void
    {
        $question->answers()->delete();

        foreach ($answers as $index => $row) {
            $question->answers()->create([
                'answer_text' => $row['answer_text'],
                'explanation' => blank($row['explanation'] ?? null) ? null : $row['explanation'],
                'is_correct' => $row['is_correct'],
                'sort_order' => $index,
            ]);
        }
    }
}
