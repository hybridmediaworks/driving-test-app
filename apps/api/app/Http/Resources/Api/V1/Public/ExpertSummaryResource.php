<?php

namespace App\Http\Resources\Api\V1\Public;

use App\Models\Expert;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The compact expert shape used by the "verified by" trust badges on state and quiz pages —
 * just what the badge shows plus the slug to link through to the full profile.
 *
 * @mixin Expert
 */
class ExpertSummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'slug' => $this->slug,
            'name' => $this->name,
            'title' => $this->title,
            'credentials' => $this->credentials,
            'role_label' => $this->role_label,
            'verified_at' => $this->verified_at?->format('Y-m-d'),
            'photo_url' => $this->photo_url,
        ];
    }
}
