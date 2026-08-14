<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\AmbientTrack;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AmbientTrack */
class AmbientTrackResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quiz_category_id' => $this->quiz_category_id,
            'title' => $this->title,
            'external_url' => $this->external_url,
            'disk' => $this->disk,
            'path' => $this->path,
            'url' => $this->url,
            'is_active' => $this->is_active,
            'order_no' => $this->order_no,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'category' => $this->whenLoaded('category', fn () => $this->category === null ? null : new QuizCategoryResource($this->category)),
        ];
    }
}
