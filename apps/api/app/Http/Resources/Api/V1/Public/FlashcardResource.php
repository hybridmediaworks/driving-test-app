<?php

namespace App\Http\Resources\Api\V1\Public;

use App\Models\Flashcard;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;

/**
 * Public flashcard — the front is always visible (it's the teaser), but `back_text` and
 * `image_url` are withheld unless the requester can read the full card, same withholding
 * principle as QuizQuestionResource hiding answer explanations pre-submission.
 *
 * @mixin Flashcard
 */
class FlashcardResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // This resource is only ever served from routes with no auth:sanctum middleware (guests
        // may browse) — $request->user() with no guard resolves via the ambient default guard,
        // which never sees the Sanctum token. Resolve explicitly.
        $unlocked = Gate::forUser($request->user('sanctum'))->allows('readFull', $this->resource);

        return [
            'id' => $this->id,
            'front_text' => $this->front_text,
            'back_text' => $unlocked ? $this->back_text : null,
            'image_url' => $unlocked ? $this->image_url : null,
            'topic' => $this->topic,
            'is_premium' => $this->is_premium,
            'locked' => ! $unlocked,
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
