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
            // `best_score` is this user's highest score across their completed attempts of this quiz
            // (from withMax on the list endpoint; null for guests and on the single-quiz show response).
            //  - attempted: has completed it at least once → drives the progressive ladder (finish one
            //    to unlock the next).
            //  - user_passed: true/false against the pass line, or null when not attempted → drives the
            //    pass (green tick) / fail (red mark) badge. The 80% default mirrors the quiz player's
            //    own line (quiz.passing_score_percent ?? 80).
            'attempted' => $this->best_score !== null,
            'user_passed' => $this->best_score === null
                ? null
                : (int) $this->best_score >= ($this->passing_score_percent ?? 80),
            // Progressive ladder state, resolved server-side on a full ladder request (see
            // ResolveQuizProgression) so every client renders the same chain:
            //  - lock_reason: null = open, "premium" = not entitled (route to pricing), "progress" =
            //    entitled but the previous quiz isn't finished yet (locked silently).
            //  - is_next: the single quiz the learner should take now.
            // When not resolved (e.g. a `slug` lookup), lock_reason falls back to the payment-only
            // state and is_next is false.
            'lock_reason' => array_key_exists('lock_reason', $this->resource->getAttributes())
                ? $this->resource->getAttribute('lock_reason')
                : ($unlocked ? null : 'premium'),
            'is_next' => (bool) ($this->resource->getAttribute('is_next') ?? false),
            'pass_rate' => $this->passRate(),
            'cover_image_url' => $this->cover_image_url,
            // A representative question image so listing cards can show real quiz content instead of
            // a shared generic cover. Null when the quiz has no images or the relation wasn't loaded
            // (e.g. the single-quiz `show` response, which doesn't need a thumbnail).
            'preview_image_url' => $this->whenLoaded(
                'previewImageQuestion',
                fn () => $this->previewImageQuestion?->image_urls[0] ?? null,
            ),
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
