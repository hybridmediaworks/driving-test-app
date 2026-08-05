<?php

namespace App\Http\Resources\Api\V1;

use App\Models\FamilyGroup;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin FamilyGroup */
class FamilyGroupResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'max_seats' => $this->max_seats,
            'status' => $this->status,
            'purchased_at' => $this->purchased_at,
            'members' => FamilyMemberResource::collection($this->whenLoaded('members')),
        ];
    }
}
