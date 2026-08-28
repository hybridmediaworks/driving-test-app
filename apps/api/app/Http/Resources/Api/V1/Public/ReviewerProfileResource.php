<?php

namespace App\Http\Resources\Api\V1\Public;

use App\Models\ReviewerProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ReviewerProfile */
class ReviewerProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'name' => $this->name,
            'title' => $this->title,
            'verified_at' => $this->verified_at?->format('Y-m-d'),
            'photo_url' => $this->photo_url,
        ];
    }
}
