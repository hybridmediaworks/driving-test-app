<?php

namespace App\Http\Resources\Api\V1\Public;

use App\Models\HazardSimulator;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;

/**
 * The teaser shape — everything here is safe to show a locked (non-entitled) caller: catalog
 * identity pulled off the Video, difficulty/length/location chips, the hazard categories present,
 * and how many hazards are taught vs scored. The playback manifest (provider ids, demo-hazard
 * timings/comments, per-window answer key) is assembled by the controller only when `attempt` is
 * allowed — never in here.
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
        $unlocked = Gate::forUser($request->user('sanctum'))->allows('attempt', $this->resource);
        $video = $this->whenLoaded('video');

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $video?->title,
            'description' => $video?->description,
            'thumbnail_url' => $video?->thumbnail_url,
            'duration_seconds' => $video?->duration_seconds,
            'is_premium' => (bool) ($video?->is_premium ?? true),
            'locked' => ! $unlocked,
            'test_level' => $this->test_level,
            'test_location' => $this->test_location,
            'test_number' => $this->test_number,
            'hazard_count' => $this->hazard_count,
            'demo_hazard_count' => $this->demo_hazard_count,
            'pass_threshold_percent' => $this->pass_threshold_percent,
            // best_score/attempted/passed come from index()'s withMax('attempts as best_score') —
            // null on the single-simulator show() response (see `last_attempt` there instead) and
            // for a caller with no identity yet (anonymous guest, no X-Guest-Token sent). `passed`
            // is recomputed against the CURRENT pass_threshold_percent rather than trusting the
            // graded attempt's own `passed` column, so it stays correct if staff retune the
            // threshold later — mirrors QuizResource's `user_passed`.
            'attempted' => $this->best_score !== null,
            'best_score' => $this->best_score !== null ? (int) $this->best_score : null,
            'passed' => $this->best_score === null || $this->pass_threshold_percent === null
                ? null
                : (int) $this->best_score >= $this->pass_threshold_percent,
            'categories' => $this->whenLoaded('hazards', fn () => $this->hazards
                ->where('in_timeline', true)
                ->map(fn ($h) => $h->type->value)
                ->unique()
                ->values()
                ->all()),
            'section' => $video?->section,
            'state' => $this->whenLoaded('video', fn () => $video?->relationLoaded('state') && $video->state
                ? ['id' => $video->state->id, 'code' => $video->state->code, 'name' => $video->state->name]
                : null),
            'vehicle_type' => $this->whenLoaded('video', fn () => $video?->relationLoaded('vehicleType') && $video->vehicleType
                ? ['id' => $video->vehicleType->id, 'name' => $video->vehicleType->name, 'title' => $video->vehicleType->title]
                : null),
        ];
    }
}
