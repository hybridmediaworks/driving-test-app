<?php

namespace App\Http\Resources\Api\V1;

use App\Models\FamilyMember;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin FamilyMember */
class FamilyMemberResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'role' => $this->role,
            'invited_email' => $this->invited_email,
            'invite_status' => $this->invite_status,
            'invited_at' => $this->invited_at,
            'claimed_at' => $this->claimed_at,
            'user' => $this->whenLoaded('user', fn () => $this->user === null ? null : [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
        ];
    }
}
