<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Video */
class VideoResource extends JsonResource
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
            'test_track' => $this->test_track,
            'section' => $this->section,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'duration_seconds' => $this->duration_seconds,
            'source_url' => $this->source_url,
            'external_url' => $this->external_url,
            'disk' => $this->disk,
            'path' => $this->path,
            'url' => $this->url,
            'is_premium' => $this->is_premium,
            'is_active' => $this->is_active,
            'order_no' => $this->order_no,
            'thumbnail_url' => $this->thumbnail_url,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'category' => $this->whenLoaded('category', fn () => $this->category === null ? null : new QuizCategoryResource($this->category)),
            'state' => $this->whenLoaded('state', fn () => $this->state === null ? null : new StateResource($this->state)),
            'vehicle_type' => $this->whenLoaded('vehicleType', fn () => $this->vehicleType === null ? null : new VehicleTypeResource($this->vehicleType)),
        ];
    }
}
