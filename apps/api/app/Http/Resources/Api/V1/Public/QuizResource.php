<?php

namespace App\Http\Resources\Api\V1\Public;

use App\Enums\AttemptStatus;
use App\Models\Quiz;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;

/** @mixin Quiz */
class QuizResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // This resource is served from routes with no auth:sanctum middleware (guests may
        // browse) — $request->user() with no guard resolves via the ambient default guard, which
        // never sees the Sanctum token. Resolve explicitly, same as FlashcardResource.
        $unlocked = Gate::forUser($request->user('sanctum'))->allows('attempt', $this->resource);

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'test_track' => $this->test_track,
            'total_questions' => $this->total_questions,
            'duration_seconds' => $this->duration_seconds,
            'passing_score_percent' => $this->passing_score_percent,
            'is_premium' => $this->is_premium,
            'locked' => ! $unlocked,
            'pass_rate' => $this->passRate(),
            'cover_image_url' => $this->cover_image_url,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'title' => $this->category->title,
            ]),
            'quiz_type' => $this->whenLoaded('quizType', fn () => [
                'id' => $this->quizType->id,
                'name' => $this->quizType->name,
                'title' => $this->quizType->title,
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

    /**
     * Real pass rate for this specific quiz (0-100), from graded attempts' persisted `passed`
     * flag — null (not 0) when there's no real attempt data yet, so the frontend can omit the
     * stat entirely instead of showing a misleading 0%. One aggregate query per row when this
     * resource backs a collection — acceptable at this app's current quiz/traffic volume (same
     * per-row cost class as the `Gate::allows` check above), revisit if `/quizzes` listings ever
     * need to scale past a few hundred rows per request.
     */
    private function passRate(): ?int
    {
        $graded = $this->attempts()->where('status', AttemptStatus::Completed)->whereNotNull('passed');
        $total = (clone $graded)->count();

        if ($total === 0) {
            return null;
        }

        return (int) round((clone $graded)->where('passed', true)->count() / $total * 100);
    }
}
