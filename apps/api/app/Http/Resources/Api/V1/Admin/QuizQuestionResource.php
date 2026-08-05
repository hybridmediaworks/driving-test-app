<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\QuizQuestion;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin QuizQuestion */
class QuizQuestionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quiz_id' => $this->quiz_id,
            'question_text' => $this->question_text,
            'explanation' => $this->explanation,
            'difficulty' => $this->difficulty,
            'topic' => $this->topic,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'image_urls' => $this->image_urls,
            'answers' => QuizAnswerResource::collection($this->whenLoaded('answers')),
        ];
    }
}
