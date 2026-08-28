<?php

namespace App\Http\Resources\Api\V1\Public;

use App\Models\QuizQuestion;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A saved Challenge Bank question. Same pre-submission shape as QuizQuestionResource (no
 * explanation until an answer is checked), plus `quiz_id` so the client can grade an answer against
 * the question's original quiz via the existing `POST /quizzes/{quiz}/questions/{question}/check`.
 *
 * @mixin QuizQuestion
 */
class ChallengeBankQuestionResource extends JsonResource
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
            'topic' => $this->topic,
            'difficulty' => $this->difficulty,
            'image_urls' => $this->image_urls,
            'answers' => QuizAnswerOptionResource::collection($this->whenLoaded('answers')),
            'assets' => QuizQuestionAssetResource::collection($this->whenLoaded('assets')),
        ];
    }
}
