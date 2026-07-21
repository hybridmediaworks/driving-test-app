<?php

namespace App\Http\Resources\Api\V1\Public;

use App\Models\Quiz;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Quiz */
class QuizResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'test_track' => $this->test_track,
            'total_questions' => $this->total_questions,
            'duration_seconds' => $this->duration_seconds,
            'passing_score_percent' => $this->passing_score_percent,
            'is_premium' => $this->is_premium,
            'cover_image_url' => $this->cover_image_url,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'title' => $this->category->title,
            ]),
            'quiz_type' => $this->whenLoaded('quizType', fn () => [
                'id' => $this->quizType->id,
                'name' => $this->quizType->name,
                'title' => $this->quizType->title,
            ]),
            'state' => $this->whenLoaded('state', fn () => $this->state === null ? null : [
                'id' => $this->state->id,
                'code' => $this->state->code,
                'name' => $this->state->name,
            ]),
            'vehicle_type' => $this->whenLoaded('vehicleType', fn () => $this->vehicleType === null ? null : [
                'id' => $this->vehicleType->id,
                'name' => $this->vehicleType->name,
                'title' => $this->vehicleType->title,
            ]),
        ];
    }
}
