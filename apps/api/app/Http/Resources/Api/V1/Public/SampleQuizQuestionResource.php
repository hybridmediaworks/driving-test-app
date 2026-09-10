<?php

namespace App\Http\Resources\Api\V1\Public;

use App\Models\QuizQuestion;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A question shown as a worked example on a quiz's public landing page — unlike
 * {@see QuizQuestionResource}, this one carries the explanation and marks the correct option,
 * because showing the answer is the entire point of that block. Only ever served by
 * `GET /quizzes/{quiz}/sample-questions`, which caps how many questions it will hand back.
 *
 * @mixin QuizQuestion
 */
class SampleQuizQuestionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'question_text' => $this->question_text,
            'explanation' => $this->explanation,
            'topic' => $this->topic,
            'difficulty' => $this->difficulty,
            'image_urls' => $this->image_urls,
            'answers' => $this->whenLoaded('answers', fn () => $this->answers
                ->sortBy('sort_order')
                ->values()
                ->map(fn ($answer) => [
                    'id' => $answer->id,
                    'answer_text' => $answer->answer_text,
                    'is_correct' => (bool) $answer->is_correct,
                    'explanation' => $answer->explanation,
                ])),
        ];
    }
}
