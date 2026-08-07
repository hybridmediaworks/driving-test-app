<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\HandbookChapter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin HandbookChapter */
class HandbookChapterResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'sections' => HandbookSectionResource::collection($this->whenLoaded('sections')),
        ];
    }
}
