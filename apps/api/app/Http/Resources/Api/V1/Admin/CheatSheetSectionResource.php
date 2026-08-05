<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\CheatSheetSection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin CheatSheetSection */
class CheatSheetSectionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'heading' => $this->heading,
            'body_markdown' => $this->body_markdown,
            'sort_order' => $this->sort_order,
        ];
    }
}
