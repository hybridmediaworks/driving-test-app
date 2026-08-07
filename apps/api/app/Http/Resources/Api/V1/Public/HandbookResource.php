<?php

namespace App\Http\Resources\Api\V1\Public;

use App\Models\Handbook;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Not premium-gated — the real crawled data carries no paywall signal for handbook content, so
 * (unlike CheatSheetResource/VideoResource) this always includes chapters/sections directly, no
 * separate locked-teaser split.
 *
 * @mixin Handbook
 */
class HandbookResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'source_url' => $this->source_url,
            'total_words' => $this->total_words,
            'pdf_url' => $this->pdf_url,
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
            'chapters' => HandbookChapterResource::collection($this->whenLoaded('chapters')),
        ];
    }
}
