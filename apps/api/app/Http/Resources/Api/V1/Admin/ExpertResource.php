<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\Expert;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Expert
 */
class ExpertResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'title' => $this->title,
            'credentials' => $this->credentials,
            'role_label' => $this->role_label,
            'intro' => $this->intro,
            'linkedin_url' => $this->linkedin_url,
            'email' => $this->email,
            'sections' => collect($this->sections ?? [])
                ->map(fn (array $section): array => [
                    'heading' => (string) ($section['heading'] ?? ''),
                    'body' => (string) ($section['body'] ?? ''),
                ])
                ->values()
                ->all(),
            'verified_at' => $this->verified_at?->format('Y-m-d'),
            'sort_order' => $this->sort_order,
            'is_published' => $this->is_published,
            'photo_url' => $this->photo_url,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
