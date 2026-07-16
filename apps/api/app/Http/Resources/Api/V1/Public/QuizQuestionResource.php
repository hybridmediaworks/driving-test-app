<?php

namespace App\Http\Resources\Api\V1\Public;

use App\Models\QuizQuestion;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Pre-submission question — deliberately excludes explanation.
 *
 * @mixin QuizQuestion
 */
class QuizQuestionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'question_text' => $this->question_text,
            'topic' => $this->topic,
            'difficulty' => $this->difficulty,
            'image_urls' => $this->image_urls,
            'answers' => QuizAnswerOptionResource::collection($this->whenLoaded('answers')),
        ];
    }
}
