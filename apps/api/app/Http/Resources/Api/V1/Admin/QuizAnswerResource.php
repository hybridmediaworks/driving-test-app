<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\QuizAnswer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin QuizAnswer */
class QuizAnswerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quiz_question_id' => $this->quiz_question_id,
            'answer_text' => $this->answer_text,
            'explanation' => $this->explanation,
            'is_correct' => $this->is_correct,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
