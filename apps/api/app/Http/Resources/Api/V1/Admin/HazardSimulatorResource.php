<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\HazardSimulator;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Flat, ungated admin view of a hazard simulator. The Video subset is inlined (staff manage the
 * Video itself at /admin/videos); `hazards` is included only when eager-loaded.
 *
 * @mixin HazardSimulator
 */
class HazardSimulatorResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'video_id' => $this->video_id,
            'slug' => $this->slug,
            'sim_id' => $this->sim_id,
            'page_id' => $this->page_id,
            'provider' => $this->provider,
            'provider_video_id' => $this->provider_video_id,
            'test_level' => $this->test_level,
            'test_location' => $this->test_location,
            'test_number' => $this->test_number,
            'hazard_count' => $this->hazard_count,
            'demo_hazard_count' => $this->demo_hazard_count,
            'pass_threshold_percent' => $this->pass_threshold_percent,
            'scoring_profile' => $this->scoring_profile,
            'is_active' => $this->is_active,
            'content_locked' => $this->content_locked,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'hazards_count' => $this->whenCounted('hazards'),
            'attempts_count' => $this->whenCounted('attempts'),
            'video' => $this->whenLoaded('video', fn () => $this->video === null ? null : [
                'id' => $this->video->id,
                'title' => $this->video->title,
                'thumbnail_url' => $this->video->thumbnail_url,
                'is_premium' => $this->video->is_premium,
                'is_active' => $this->video->is_active,
                'section' => $this->video->section,
                'state' => $this->video->relationLoaded('state') && $this->video->state
                    ? ['id' => $this->video->state->id, 'code' => $this->video->state->code, 'name' => $this->video->state->name]
                    : null,
                'vehicle_type' => $this->video->relationLoaded('vehicleType') && $this->video->vehicleType
                    ? ['id' => $this->video->vehicleType->id, 'name' => $this->video->vehicleType->name, 'title' => $this->video->vehicleType->title]
                    : null,
            ]),
            'hazards' => HazardResource::collection($this->whenLoaded('hazards')),
        ];
    }
}
