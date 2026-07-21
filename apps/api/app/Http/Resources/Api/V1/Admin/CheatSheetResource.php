<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\CheatSheet;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin CheatSheet */
class CheatSheetResource extends JsonResource
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
            'title' => $this->title,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'order_no' => $this->order_no,
            'is_premium' => $this->is_premium,
            'is_active' => $this->is_active,
            'cover_image_url' => $this->cover_image_url,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'sections_count' => $this->whenCounted('sections'),
            'category' => $this->whenLoaded('category', fn () => $this->category === null ? null : new QuizCategoryResource($this->category)),
            'state' => $this->whenLoaded('state', fn () => $this->state === null ? null : new StateResource($this->state)),
            'vehicle_type' => $this->whenLoaded('vehicleType', fn () => $this->vehicleType === null ? null : new VehicleTypeResource($this->vehicleType)),
            'sections' => CheatSheetSectionResource::collection($this->whenLoaded('sections')),
        ];
    }
}
