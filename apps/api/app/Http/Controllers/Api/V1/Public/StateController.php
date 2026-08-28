<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Enums\AttemptStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Public\StateResource;
use App\Models\QuizAttempt;
use App\Models\State;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StateController extends Controller
{
    /**
     * List states
     *
     * Public — no authentication required. Alphabetical by name, not paginated — the full seeded
     * list (all US states) is small enough to return in one response. Use `code` as the value for
     * the `state` filter on `GET /quizzes`.
     */
    public function index(): AnonymousResourceCollection
    {
        return StateResource::collection(State::query()->orderBy('name')->get());
    }

    /**
     * Live activity stats for a state
     *
     * Public — no authentication required. Computed live from `quiz_attempts`/`quizzes`, no
     * cached/baseline numbers — real usage today is small, so these will read small too, and grow
     * honestly as usage grows (see docs/PHASE_3_CONTENT_PLATFORM.md). Optionally scope by
     * `vehicle_type` (name, e.g. `car`); omit it to aggregate across all vehicle types for the
     * state. Deliberately has no nationwide-rank figure — see that doc for why.
     */
    public function stats(Request $request, string $code): JsonResponse
    {
        $state = State::query()->where('code', strtoupper($code))->firstOrFail();

        $base = QuizAttempt::query()
            ->whereHas('quiz', function ($q) use ($state, $request): void {
                $q->where('state_id', $state->id);
                if ($request->filled('vehicle_type')) {
                    $vehicleType = $request->string('vehicle_type')->toString();
                    $q->whereHas('vehicleType', fn ($q2) => $q2->where('name', $vehicleType));
                }
            });

        // started_at (when the attempt actually happened), not created_at (when the row was
        // written) — the two are usually seconds apart for organic traffic, but only started_at
        // is meaningful once imported/backfilled historical attempts exist.
        $completed30d = (clone $base)
            ->where('status', AttemptStatus::Completed)
            ->where('started_at', '>=', now()->subDays(30));

        $activeToday = (clone $base)->where('started_at', '>=', now()->startOfDay());

        return response()->json([
            'state' => new StateResource($state),
            'stats' => [
                'active_today' => $this->distinctParticipants(clone $activeToday),
                'students_practiced_30d' => $this->distinctParticipants(clone $completed30d),
                'questions_answered_total' => (int) (clone $completed30d)->sum('total_questions'),
                'avg_session_seconds' => $this->nullableRound((clone $completed30d)->avg('duration_seconds')),
                'combined_practice_seconds' => (int) (clone $completed30d)->sum('duration_seconds'),
                'peak_hour' => $this->peakHour(clone $completed30d),
                'peak_weekday' => $this->peakWeekday(clone $completed30d),
                'pass_rate' => $this->passRate(clone $base),
                'daily_students_practiced' => $this->dailyDistinctParticipants(clone $completed30d),
                'daily_questions_answered' => $this->dailySum(clone $completed30d, 'total_questions'),
                'daily_combined_practice_seconds' => $this->dailySum(clone $completed30d, 'duration_seconds'),
            ],
        ]);
    }

    /**
     * Real pass rate across every graded attempt for this scope (all-time, not the 30-day window
     * above — a "how do learners here do" claim reads as a durable stat, not a rolling one). Null
     * when there's no real attempt data yet, so the frontend can omit the stat rather than show a
     * misleading 0%.
     *
     * @param  Builder<QuizAttempt>  $query
     */
    private function passRate($query): ?int
    {
        $graded = $query->where('status', AttemptStatus::Completed)->whereNotNull('passed');
        $total = (clone $graded)->count();

        if ($total === 0) {
            return null;
        }

        return (int) round((clone $graded)->where('passed', true)->count() / $total * 100);
    }

    /**
     * Most common hour-of-day (0-23) among a scoped set of attempts, computed in PHP rather than
     * a DB-specific `HOUR()`/`strftime()` call — this is a "single mode of a small grouped set"
     * calculation, not a hot path, so portability across MySQL (prod) and SQLite (tests) wins over
     * pushing it into SQL.
     *
     * @param  Builder<QuizAttempt>  $query
     */
    private function peakHour($query): ?int
    {
        // ->get() (not ->pluck()) deliberately — Eloquent's pluck() reads raw column values via
        // the underlying query builder and skips model casts, so started_at would come back as a
        // plain string instead of a Carbon instance.
        $hour = $query->get(['started_at'])
            ->map(fn (QuizAttempt $attempt) => $attempt->started_at->hour)
            ->countBy()
            ->sortDesc()
            ->keys()
            ->first();

        return $hour === null ? null : (int) $hour;
    }

    /**
     * Most common weekday name among a scoped set of attempts — same "single mode of a small
     * grouped set, computed in PHP for MySQL/SQLite portability" approach as {@see peakHour()}.
     *
     * @param  Builder<QuizAttempt>  $query
     */
    private function peakWeekday($query): ?string
    {
        return $query->get(['started_at'])
            ->map(fn (QuizAttempt $attempt) => $attempt->started_at->format('l'))
            ->countBy()
            ->sortDesc()
            ->keys()
            ->first();
    }

    /**
     * Distinct participants (logged-in users + guests) in a scoped attempt query — a guest who
     * took 5 attempts today counts once, same as a logged-in user would.
     *
     * @param  Builder<QuizAttempt>  $query
     */
    private function distinctParticipants($query): int
    {
        $userCount = (clone $query)->whereNotNull('user_id')->distinct('user_id')->count('user_id');
        $guestCount = (clone $query)->whereNull('user_id')->whereNotNull('guest_token')->distinct('guest_token')->count('guest_token');

        return $userCount + $guestCount;
    }

    /**
     * Distinct participants per calendar day for the last 7 days (oldest first), zero-filled —
     * powers a public-facing sparkline. One pair of count queries per day rather than a single
     * grouped query, since "distinct" here means de-duped across the user_id/guest_token split
     * (see {@see distinctParticipants()}), which a single GROUP BY day can't express. This is a
     * low-traffic public endpoint, not a hot path — same tradeoff already made in peakHour().
     *
     * @param  Builder<QuizAttempt>  $query
     * @return list<int>
     */
    private function dailyDistinctParticipants($query): array
    {
        return collect(range(6, 0))
            ->map(function (int $daysAgo) use ($query) {
                $day = now()->subDays($daysAgo);

                return $this->distinctParticipants(
                    (clone $query)->whereBetween('started_at', [$day->copy()->startOfDay(), $day->copy()->endOfDay()])
                );
            })
            ->values()
            ->all();
    }

    /**
     * Sum of `$column` per calendar day for the last 7 days (oldest first), zero-filled — same
     * shape as `Admin\StatsController::dailyCounts()` but SUM(column) instead of COUNT(*), and
     * keyed off `started_at` (this controller's convention) rather than `created_at`.
     *
     * @param  Builder<QuizAttempt>  $query
     * @return list<int>
     */
    private function dailySum($query, string $column): array
    {
        $sums = $query
            ->where('started_at', '>=', now()->subDays(6)->startOfDay())
            ->selectRaw("DATE(started_at) as day, SUM({$column}) as total")
            ->groupBy('day')
            ->pluck('total', 'day');

        return collect(range(6, 0))
            ->map(fn (int $daysAgo) => now()->subDays($daysAgo)->toDateString())
            ->map(fn (string $day) => (int) ($sums[$day] ?? 0))
            ->values()
            ->all();
    }

    private function nullableRound(mixed $value): ?float
    {
        return $value === null ? null : round((float) $value, 1);
    }
}
