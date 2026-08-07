<?php

namespace App\Http\Resources\Api\V1\Public;

use App\Models\HandbookSection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin HandbookSection */
class HandbookSectionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'heading' => $this->heading,
            'content' => $this->content,
        ];
    }
}
