<?php

namespace App\Http\Resources\Api\V1\Public;

use App\Models\CheatSheet;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;

/**
 * The teaser shape — title/summary/cover are always visible (used by both `index` and `show`).
 * Full sections/PDF are handled separately by the controller, since whether they're included
 * depends on a Gate check the resource itself doesn't have enough context to make cleanly. The
 * `locked` field below is cheap by comparison — it doesn't need to withhold anything else in this
 * teaser shape, just report the viewer's own access, same as FlashcardResource does.
 *
 * @mixin CheatSheet
 */
class CheatSheetResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Resolve explicitly — see QuizResource for why (no auth:sanctum middleware on this route).
        $unlocked = Gate::forUser($request->user('sanctum'))->allows('readFull', $this->resource);

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'is_premium' => $this->is_premium,
            'locked' => ! $unlocked,
            'cover_image_url' => $this->cover_image_url,
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
