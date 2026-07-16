<?php

namespace App\Http\Resources\Api\V1\Admin;

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
            'quiz_category_id' => $this->quiz_category_id,
            'quiz_type_id' => $this->quiz_type_id,
            'state_id' => $this->state_id,
            'vehicle_type_id' => $this->vehicle_type_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'test_track' => $this->test_track,
            'order_no' => $this->order_no,
            'total_questions' => $this->total_questions,
            'duration_seconds' => $this->duration_seconds,
            'is_premium' => $this->is_premium,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'cover_image_url' => $this->cover_image_url,
            'quiz_questions_count' => $this->whenCounted('quizQuestions'),
            'category' => $this->whenLoaded('category', fn () => new QuizCategoryResource($this->category)),
            'quiz_type' => $this->whenLoaded('quizType', fn () => new QuizTypeResource($this->quizType)),
            'state' => $this->whenLoaded('state', fn () => $this->state === null ? null : new StateResource($this->state)),
            'vehicle_type' => $this->whenLoaded('vehicleType', fn () => $this->vehicleType === null ? null : new VehicleTypeResource($this->vehicleType)),
        ];
    }
}
