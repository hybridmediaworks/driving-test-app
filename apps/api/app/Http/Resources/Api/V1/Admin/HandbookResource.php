<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\Handbook;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Handbook */
class HandbookResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'state_id' => $this->state_id,
            'vehicle_type_id' => $this->vehicle_type_id,
            'language' => $this->language,
            'title' => $this->title,
            'source_url' => $this->source_url,
            'total_words' => $this->total_words,
            'pdf_url' => $this->pdf_url,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'state' => $this->whenLoaded('state', fn () => new StateResource($this->state)),
            'vehicle_type' => $this->whenLoaded('vehicleType', fn () => new VehicleTypeResource($this->vehicleType)),
            'chapters' => HandbookChapterResource::collection($this->whenLoaded('chapters')),
        ];
    }
}
