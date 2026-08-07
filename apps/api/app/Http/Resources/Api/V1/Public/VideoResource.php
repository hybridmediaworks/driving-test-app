<?php

namespace App\Http\Resources\Api\V1\Public;

use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;

/**
 * The teaser shape — title/description/thumbnail/duration are always visible. Whether `url` is
 * actually playable is handled by the controller's `watch` gate, not this resource (same reason
 * CheatSheetResource keeps `sections` out of its own toArray()). `locked` is included here too
 * (same as CheatSheetResource) so an index listing can show a lock badge without an extra
 * per-video request.
 *
 * @mixin Video
 */
class VideoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Resolve explicitly — see QuizResource for why (no auth:sanctum middleware on this route).
        $unlocked = Gate::forUser($request->user('sanctum'))->allows('watch', $this->resource);

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'duration_seconds' => $this->duration_seconds,
            'is_premium' => $this->is_premium,
            'locked' => ! $unlocked,
            'thumbnail_url' => $this->thumbnail_url,
            'test_track' => $this->test_track,
            'section' => $this->section,
            'subsection' => $this->subsection,
            'category' => $this->whenLoaded('category', fn () => $this->category === null ? null : [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'title' => $this->category->title,
            ]),
            'state' => $this->whenLoaded('state', fn () => $this->state === null ? null : [
                'id' => $this->state->id,
                'code' => $this->state->code,
                'name' => $this->state->name,
            ]),
            'vehicle_type' => $this->whenLoaded('vehicleType', fn () => $this->vehicleType === null ? null : [
                'id' => $this->vehicleType->id,
                'name' => $this->vehicleType->name,
                'title' => $this->vehicleType->title,
            ]),
        ];
    }
}
