<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\Flashcard;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Flashcard */
class FlashcardResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quiz_category_id' => $this->quiz_category_id,
            'state_id' => $this->state_id,
            'vehicle_type_id' => $this->vehicle_type_id,
            'front_text' => $this->front_text,
            'back_text' => $this->back_text,
            'topic' => $this->topic,
            'sort_order' => $this->sort_order,
            'is_premium' => $this->is_premium,
            'is_active' => $this->is_active,
            'image_url' => $this->image_url,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'category' => $this->whenLoaded('category', fn () => $this->category === null ? null : new QuizCategoryResource($this->category)),
            'state' => $this->whenLoaded('state', fn () => $this->state === null ? null : new StateResource($this->state)),
            'vehicle_type' => $this->whenLoaded('vehicleType', fn () => $this->vehicleType === null ? null : new VehicleTypeResource($this->vehicleType)),
        ];
    }
}
