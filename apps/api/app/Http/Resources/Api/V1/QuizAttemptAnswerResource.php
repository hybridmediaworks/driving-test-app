<?php

namespace App\Http\Resources\Api\V1;

use App\Models\QuizAttemptAnswer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin QuizAttemptAnswer */
class QuizAttemptAnswerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $correctAnswer = $this->question->answers->firstWhere('is_correct', true);

        return [
            'question_id' => $this->quiz_question_id,
            'question_text' => $this->question->question_text,
            'explanation' => $this->question->explanation,
            'selected_answer_id' => $this->quiz_answer_id,
            'correct_answer_id' => $correctAnswer?->id,
            'is_correct' => $this->is_correct,
        ];
    }
}
