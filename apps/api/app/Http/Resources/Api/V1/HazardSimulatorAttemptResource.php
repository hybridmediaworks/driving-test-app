<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Hazard;
use App\Models\HazardSimulatorAttempt;
use App\Models\HazardSimulatorAttemptEvent;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

/**
 * One hazard-perception attempt. The summary fields (score, spotted, reaction, false clicks) come
 * straight off the persisted row — never recomputed here. When the simulator's hazards and the
 * attempt's events are loaded (the grading response and the review views), it also emits a
 * per-hazard `breakdown`: for every scored hazard, whether it was spotted, the learner's reaction,
 * the ideal window, the feedback copy, and the seek offset that "Review missed hazards" jumps to.
 *
 * @mixin HazardSimulatorAttempt
 */
class HazardSimulatorAttemptResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'hazard_simulator_id' => $this->hazard_simulator_id,
            'status' => $this->status,
            'score' => $this->score,
            'passed' => $this->passed,
            'hazards_spotted' => $this->hazards_spotted,
            'hazards_total' => $this->hazards_total,
            'avg_reaction_ms' => $this->avg_reaction_ms,
            'reaction_band' => $this->reaction_band,
            'false_clicks' => $this->false_clicks,
            'started_at' => $this->started_at,
            'completed_at' => $this->completed_at,
            'duration_seconds' => $this->duration_seconds,
            'simulator' => $this->whenLoaded('hazardSimulator', fn () => [
                'id' => $this->hazardSimulator->id,
                'slug' => $this->hazardSimulator->slug,
                'title' => $this->hazardSimulator->relationLoaded('video') ? $this->hazardSimulator->video?->title : null,
                'thumbnail_url' => $this->hazardSimulator->relationLoaded('video') ? $this->hazardSimulator->video?->thumbnail_url : null,
            ]),
            'user' => $this->whenLoaded('user', fn () => $this->user === null ? null : [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
            'breakdown' => $this->when(
                $this->relationLoaded('events') && $this->hazardSimulator?->relationLoaded('hazards'),
                fn () => $this->buildBreakdown(),
            ),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function buildBreakdown(): array
    {
        /** @var Collection<int, HazardSimulatorAttemptEvent> $eventsByHazard */
        $eventsByHazard = $this->events->keyBy('hazard_id');

        return $this->hazardSimulator->hazards
            ->where('in_timeline', true)
            ->sortBy('sort_order')
            ->values()
            ->map(function (Hazard $hazard) use ($eventsByHazard) {
                $event = $eventsByHazard->get($hazard->id);
                $spotted = $event !== null && $event->kind === HazardSimulatorAttemptEvent::KIND_HIT;

                return [
                    'hazard_id' => $hazard->id,
                    'type' => $hazard->type->value,
                    'type_label' => $hazard->type->label(),
                    'mode' => $hazard->mode,
                    'spotted' => $spotted,
                    'auto_credited' => $hazard->mode === 'demo',
                    'reaction_ms' => $spotted ? $event->reaction_ms : null,
                    'time_start' => (float) $hazard->time_start,
                    'time_end' => (float) $hazard->time_end,
                    'seek_to' => max(0.0, (float) $hazard->time_start - 2.0),
                    'comment' => $hazard->comment,
                    'audio_url' => $hazard->narrationUrl(),
                    'box' => $hazard->resolvedBox(),
                ];
            })
            ->all();
    }
}
