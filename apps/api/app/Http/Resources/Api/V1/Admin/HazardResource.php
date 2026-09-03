<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\Hazard;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Flat, ungated admin view of one hazard — distinct from Public\HazardResource, which resolves
 * `box` to a fallback zone and hides source fields. Here `box` is the RAW stored value so staff
 * can see null ("using the category fallback zone") vs an authored rectangle.
 *
 * @mixin Hazard
 */
class HazardResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'hazard_simulator_id' => $this->hazard_simulator_id,
            'source_hazard_id' => $this->source_hazard_id,
            'type' => $this->type->value,
            'type_raw' => $this->type_raw,
            'type_label' => $this->type->label(),
            'hazard_group' => $this->hazard_group,
            'mode' => $this->mode,
            'in_timeline' => $this->in_timeline,
            'sort_order' => $this->sort_order,
            'time_start' => (float) $this->time_start,
            'time_end' => (float) $this->time_end,
            'frame_count' => $this->frame_count,
            'box' => $this->box,
            'comment' => $this->comment,
            'audio_url' => $this->audio_url,
            'audio_disk' => $this->audio_disk,
            'audio_path' => $this->audio_path,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
