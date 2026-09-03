<?php

namespace App\Http\Resources\Api\V1\Public;

use App\Models\Hazard;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A single hazard as the PLAYER sees it. Only ever used for demo hazards in the playback manifest
 * (they're taught, so their window/box/comment/narration are sent in full) and for the per-hazard
 * review breakdown returned AFTER grading. Assessment hazards are never serialized with this
 * before a run is submitted — see HazardSimulatorController::show.
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
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'group' => $this->hazard_group,
            'mode' => $this->mode,
            'time_start' => (float) $this->time_start,
            'time_end' => (float) $this->time_end,
            'box' => $this->resolvedBox(),
            'comment' => $this->comment,
            'audio_url' => $this->narrationUrl(),
        ];
    }
}
