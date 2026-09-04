<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Actions\Hazard\DetectHazardHit;
use App\Actions\Hazard\GradeHazardAttempt;
use App\Actions\Hazard\StartHazardSimulatorAttempt;
use App\Enums\HazardAttemptStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Public\MarkHazardRequest;
use App\Http\Requests\Api\V1\Public\StartHazardAttemptRequest;
use App\Http\Requests\Api\V1\Public\StoreHazardAttemptRequest;
use App\Http\Resources\Api\V1\HazardSimulatorAttemptResource;
use App\Http\Resources\Api\V1\Public\HazardResource;
use App\Http\Resources\Api\V1\Public\HazardSimulatorResource;
use App\Models\HazardSimulator;
use App\Models\HazardSimulatorAttempt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

/**
 * Public hazard-perception simulator browsing + running. Guests may browse and attempt, exactly
 * like quizzes and videos — identity is a Bearer token or the `X-Guest-Token` header, and a guest
 * run is claimed into the account on register/login (AuthController::claimGuestData).
 */
class HazardSimulatorController extends Controller
{
    public function __construct(
        private readonly GradeHazardAttempt $grader,
        private readonly StartHazardSimulatorAttempt $starter,
        private readonly DetectHazardHit $detectHit,
    ) {}

    /**
     * List hazard simulators
     *
     * Public. Active simulators on an active video, newest-catalog-order first. Filters: `state`
     * (code, includes universal null-state rows), `vehicle_type` (name, includes universal),
     * `test_level` ("Easy"/"Medium"/"Hard"). Teaser fields + `locked` + this caller's `attempted` /
     * `best_score` / `passed` (mirrors QuizController::index's withMax so a returning learner sees
     * which ones they've already run without opening each one).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        $userId = $request->user('sanctum')?->id;
        $guestToken = $userId === null ? $this->resolveGuestToken($request) : null;

        $query = HazardSimulator::query()
            ->select('hazard_simulators.*')
            ->join('videos', 'videos.id', '=', 'hazard_simulators.video_id')
            ->where('hazard_simulators.is_active', true)
            ->where('videos.is_active', true)
            ->with(['video.state', 'video.vehicleType', 'hazards'])
            ->when($userId !== null || $guestToken !== null, fn ($q) => $q->withMax([
                'attempts as best_score' => fn ($a) => $a
                    ->where('status', HazardAttemptStatus::Completed)
                    ->when(
                        $userId !== null,
                        fn ($aq) => $aq->where('user_id', $userId),
                        fn ($aq) => $aq->where('guest_token', $guestToken),
                    ),
            ], 'score'))
            ->orderBy('videos.order_no')
            ->orderBy('videos.title');

        if ($request->filled('state')) {
            $code = $request->string('state')->toString();
            $query->where(fn ($q) => $q->whereNull('videos.state_id')
                ->orWhereHas('video.state', fn ($s) => $s->where('code', $code)));
        }

        if ($request->filled('vehicle_type')) {
            $name = $request->string('vehicle_type')->toString();
            $query->where(fn ($q) => $q->whereNull('videos.vehicle_type_id')
                ->orWhereHas('video.vehicleType', fn ($v) => $v->where('name', $name)));
        }

        if ($request->filled('test_level')) {
            $query->where('hazard_simulators.test_level', $request->string('test_level')->toString());
        }

        return HazardSimulatorResource::collection($query->paginate($perPage)->withQueryString());
    }

    /**
     * Show a hazard simulator
     *
     * Public. The teaser is always visible. When the caller may `attempt` (free simulator, or
     * premium + entitled), the response also carries a **playback manifest**: the provider ids and
     * embed url, the demo hazards IN FULL (they're taught — window, box, feedback copy, narration),
     * and for the scored hazards only a count. Scored-hazard windows/comments/boxes are the answer
     * key and stay server-side; the live `mark` endpoint reveals one at a time as it's spotted.
     *
     * Also carries `last_attempt` — this caller's most recently completed run on this simulator,
     * full breakdown included, so the player page can restore the results screen after a refresh
     * instead of dropping back to the intro (it otherwise has no way to know a completed attempt
     * exists — see git history around the 2026-09 "nothing shows I already tried it" report).
     */
    public function show(Request $request, HazardSimulator $hazardSimulator): JsonResponse
    {
        $this->authorize('view', $hazardSimulator);

        $hazardSimulator->load(['video.state', 'video.vehicleType', 'hazards']);
        $user = $request->user('sanctum');
        $unlocked = Gate::forUser($user)->allows('attempt', $hazardSimulator);

        $manifest = null;
        if ($unlocked) {
            $demo = $hazardSimulator->hazards
                ->where('mode', 'demo')
                ->sortBy([['sort_order', 'asc'], ['time_start', 'asc']])
                ->values();
            $assessment = $hazardSimulator->hazards->where('in_timeline', true)->where('mode', 'assessment');

            $manifest = [
                'provider' => $hazardSimulator->provider,
                'provider_video_id' => $hazardSimulator->provider_video_id,
                'embed_url' => $hazardSimulator->video?->external_url,
                'duration_seconds' => $hazardSimulator->video?->duration_seconds,
                'scored_hazard_count' => $assessment->count(),
                'demo_hazard_count' => $demo->count(),
                'pass_threshold_percent' => $hazardSimulator->pass_threshold_percent,
                // When the last demo window closes — the player shows the "your turn" hand-off card
                // around here and stops highlighting.
                'handoff_after_seconds' => $demo->max('time_end'),
                'first_assessment_seconds' => $assessment->min('time_start'),
                'demo_hazards' => HazardResource::collection($demo),
            ];
        }

        $lastAttempt = null;
        $guestToken = $user === null ? $this->resolveGuestToken($request) : null;
        if ($unlocked && ($user !== null || $guestToken !== null)) {
            $found = $hazardSimulator->attempts()
                ->where('status', HazardAttemptStatus::Completed)
                ->when(
                    $user !== null,
                    fn ($q) => $q->where('user_id', $user->id),
                    fn ($q) => $q->where('guest_token', $guestToken),
                )
                ->withReviewDetails()
                ->latest('completed_at')
                ->first();
            $lastAttempt = $found ? new HazardSimulatorAttemptResource($found) : null;
        }

        return response()->json([
            'simulator' => new HazardSimulatorResource($hazardSimulator),
            'locked' => ! $unlocked,
            'manifest' => $manifest,
            'last_attempt' => $lastAttempt,
        ]);
    }

    /**
     * Start a hazard run
     *
     * Opens an `in_progress` attempt (guest or auth). A hazard run isn't resumable from the middle,
     * so this doesn't reattach to an old attempt — but a double call from a fast reload folds back
     * into the same fresh row unless `force_new` (Try Again).
     */
    public function startAttempt(StartHazardAttemptRequest $request, HazardSimulator $hazardSimulator): JsonResponse
    {
        $user = $request->user('sanctum');
        Gate::forUser($user)->authorize('attempt', $hazardSimulator);

        $guestToken = $user === null
            ? ($this->resolveGuestToken($request) ?? (string) Str::uuid())
            : null;

        $attempt = ($this->starter)($hazardSimulator, $user?->id, $guestToken, $request->boolean('force_new'));

        return response()->json([
            'attempt' => [
                'id' => $attempt->id,
                'started_at' => $attempt->started_at,
                'hazards_total' => $attempt->hazards_total,
            ],
            'guest_token' => $guestToken,
        ]);
    }

    /**
     * Mark a hazard (live feedback)
     *
     * One click during the scored phase. Returns whether it landed on a scored hazard (with its
     * feedback copy + narration so the player can pop the card) or was absorbed by a taught /
     * unscored hazard, or was a false click. Records nothing — `storeAttempt` re-grades the whole
     * log authoritatively.
     */
    public function mark(MarkHazardRequest $request, HazardSimulator $hazardSimulator, HazardSimulatorAttempt $attempt): JsonResponse
    {
        $user = $request->user('sanctum');
        Gate::forUser($user)->authorize('attempt', $hazardSimulator);

        $owned = $this->starter->findOwned(
            $attempt->id,
            $hazardSimulator,
            $user?->id,
            $user === null ? $this->resolveGuestToken($request) : null,
        );

        if ($owned === null) {
            return response()->json(['message' => 'No open attempt for this simulator.'], 422);
        }

        $hazard = ($this->detectHit)($hazardSimulator->hazards()->get(), (int) $request->integer('video_ms'));
        $scoredHit = $hazard !== null && $hazard->in_timeline && $hazard->mode === 'assessment';

        return response()->json([
            'hit' => $scoredHit,
            'absorbed' => $hazard !== null && ! $scoredHit,
            'hazard' => $scoredHit ? [
                'id' => $hazard->id,
                'type' => $hazard->type->value,
                'type_label' => $hazard->type->label(),
                'comment' => $hazard->comment,
                'audio_url' => $hazard->narrationUrl(),
                'time_start' => (float) $hazard->time_start,
                'time_end' => (float) $hazard->time_end,
            ] : null,
        ]);
    }

    /**
     * Submit and grade a hazard run
     *
     * Send the whole click log `[{video_ms, x, y}]` + `duration_seconds`. The server recomputes the
     * Hazard Score from scratch (never trusts a client number) and returns the attempt with a
     * per-hazard `breakdown` — spotted/missed, your reaction, the ideal window, the feedback copy,
     * and the seek offset "Review missed hazards" jumps to.
     */
    public function storeAttempt(StoreHazardAttemptRequest $request, HazardSimulator $hazardSimulator, HazardSimulatorAttempt $attempt): JsonResponse
    {
        $user = $request->user('sanctum');
        Gate::forUser($user)->authorize('attempt', $hazardSimulator);

        $guestToken = $user === null
            ? ($this->resolveGuestToken($request) ?? (string) Str::uuid())
            : null;

        $owned = $this->starter->findOwned($attempt->id, $hazardSimulator, $user?->id, $guestToken);
        if ($owned === null) {
            return response()->json(['message' => 'This attempt is not open for submission.'], 422);
        }

        $graded = ($this->grader)(
            $hazardSimulator,
            $request->validated('events'),
            $user?->id,
            $guestToken,
            $request->integer('duration_seconds') ?: null,
            $owned->id,
        );

        return response()->json(['attempt' => new HazardSimulatorAttemptResource($graded)], 201);
    }

    /**
     * A caller's guest identity — the `X-Guest-Token` header the web client attaches once it has
     * generated one, falling back to a `guest_token` body field. Never generates one here.
     */
    private function resolveGuestToken(Request $request): ?string
    {
        $token = $request->header('X-Guest-Token') ?: $request->input('guest_token');

        return is_string($token) && $token !== '' ? $token : null;
    }
}
