<?php

namespace App\Http\Resources\Api\V1\Public;

use App\Models\Expert;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The full public expert profile — everything the /experts/{slug} page renders.
 *
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
            // Plain date, not a full ISO datetime — the frontend date formatting and the admin
            // date input both depend on this exact shape.
            'verified_at' => $this->verified_at?->format('Y-m-d'),
            'photo_url' => $this->photo_url,
        ];
    }
}
