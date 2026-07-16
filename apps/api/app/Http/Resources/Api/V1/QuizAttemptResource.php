<?php

namespace App\Http\Resources\Api\V1;

use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin QuizAttempt */
class QuizAttemptResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quiz_id' => $this->quiz_id,
            'status' => $this->status,
            'score' => $this->score,
            'correct_count' => $this->correct_count,
            'total_questions' => $this->total_questions,
            'started_at' => $this->started_at,
            'completed_at' => $this->completed_at,
            'duration_seconds' => $this->duration_seconds,
            'quiz' => $this->whenLoaded('quiz', fn () => [
                'id' => $this->quiz->id,
                'title' => $this->quiz->title,
                'slug' => $this->quiz->slug,
                'category' => $this->quiz->relationLoaded('category') ? $this->quiz->category?->title : null,
            ]),
            'answers' => QuizAttemptAnswerResource::collection($this->whenLoaded('answers')),
        ];
    }
}
