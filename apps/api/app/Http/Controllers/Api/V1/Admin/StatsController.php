<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\AttemptStatus;
use App\Enums\PassGuaranteeClaimStatus;
use App\Http\Controllers\Controller;
use App\Models\CheatSheet;
use App\Models\FamilyGroup;
use App\Models\Flashcard;
use App\Models\FlashcardReview;
use App\Models\HazardSimulator;
use App\Models\PassGuaranteeClaim;
use App\Models\Plan;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\QuizCategory;
use App\Models\QuizQuestion;
use App\Models\State;
use App\Models\Subscription;
use App\Models\User;
use App\Models\Video;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
    /**
     * Dashboard stats (admin)
     *
     * Requires an admin account. Aggregate counts for the admin dashboard — no pagination, no
     * filters, just current totals plus a 7-day trend figure for users and attempts.
     */
    public function index(): JsonResponse
    {
        $completedAttempts = QuizAttempt::query()->where('status', AttemptStatus::Completed);
        $averageScore = (clone $completedAttempts)->avg('score');

        $weeklyPlan = Plan::query()->where('key', 'weekly')->first();
        $monthlyPlan = Plan::query()->where('key', 'monthly')->first();

        $activeWeekly = $weeklyPlan?->stripe_price_id === null ? 0 : Subscription::query()
            ->where('stripe_status', 'active')->where('stripe_price', $weeklyPlan->stripe_price_id)->count();
        $activeMonthly = $monthlyPlan?->stripe_price_id === null ? 0 : Subscription::query()
            ->where('stripe_status', 'active')->where('stripe_price', $monthlyPlan->stripe_price_id)->count();

        return response()->json([
            'users' => [
                'total' => User::query()->count(),
                'admins' => User::query()->where('is_admin', true)->count(),
                'verified' => User::query()->whereNotNull('email_verified_at')->count(),
                'new_today' => User::query()->where('created_at', '>=', now()->startOfDay())->count(),
                'new_last_7_days' => User::query()->where('created_at', '>=', now()->subDays(7))->count(),
                'daily_new_last_7_days' => $this->dailyCounts(User::query()),
            ],
            'quizzes' => [
                'total' => Quiz::query()->count(),
                'active' => Quiz::query()->where('is_active', true)->count(),
                'categories' => QuizCategory::query()->count(),
                'questions' => QuizQuestion::query()->count(),
                'answers' => QuizAnswer::query()->count(),
            ],
            'attempts' => [
                'total' => QuizAttempt::query()->count(),
                'completed' => (clone $completedAttempts)->count(),
                'in_progress' => QuizAttempt::query()->where('status', AttemptStatus::InProgress)->count(),
                'average_score' => $averageScore === null ? null : round((float) $averageScore, 1),
                'today' => QuizAttempt::query()->where('created_at', '>=', now()->startOfDay())->count(),
                'last_7_days' => QuizAttempt::query()->where('created_at', '>=', now()->subDays(7))->count(),
                'daily_last_7_days' => $this->dailyCounts(QuizAttempt::query()),
            ],
            'content' => [
                'states' => State::query()->count(),
                'videos' => Video::query()->count(),
                'hazard_simulators' => HazardSimulator::query()->count(),
                // The library's spread across vehicle types — the one cut of the catalogue that
                // says something a single total cannot: where the content actually is.
                'questions_by_vehicle' => $this->questionsByVehicle(),
                'flashcards' => [
                    'total' => Flashcard::query()->count(),
                    'active' => Flashcard::query()->where('is_active', true)->count(),
                    'premium' => Flashcard::query()->where('is_premium', true)->count(),
                    'reviews' => FlashcardReview::query()->count(),
                ],
                'cheat_sheets' => [
                    'total' => CheatSheet::query()->count(),
                    'active' => CheatSheet::query()->where('is_active', true)->count(),
                    'premium' => CheatSheet::query()->where('is_premium', true)->count(),
                ],
            ],
            'activity' => [
                'top_states_last_7_days' => $this->topStates(),
            ],
            'billing' => [
                'active_weekly_subscribers' => $activeWeekly,
                'active_monthly_subscribers' => $activeMonthly,
                'active_family_groups' => FamilyGroup::query()->where('status', 'active')->count(),
                'recurring_revenue_cents' => $activeWeekly * ($weeklyPlan->price_cents ?? 0) + $activeMonthly * ($monthlyPlan->price_cents ?? 0),
                'claims' => [
                    'submitted' => PassGuaranteeClaim::query()->where('status', PassGuaranteeClaimStatus::Submitted)->count(),
                    'under_review' => PassGuaranteeClaim::query()->where('status', PassGuaranteeClaimStatus::UnderReview)->count(),
                    'approved' => PassGuaranteeClaim::query()->where('status', PassGuaranteeClaimStatus::Approved)->count(),
                    'denied' => PassGuaranteeClaim::query()->where('status', PassGuaranteeClaimStatus::Denied)->count(),
                    'refunded' => PassGuaranteeClaim::query()->where('status', PassGuaranteeClaimStatus::Refunded)->count(),
                ],
            ],
        ]);
    }

    /**
     * Question counts per vehicle type, largest first.
     *
     * @return list<array{name: string, questions: int}>
     */
    private function questionsByVehicle(): array
    {
        return QuizQuestion::query()
            ->join('quizzes', 'quizzes.id', '=', 'quiz_questions.quiz_id')
            ->join('vehicle_types', 'vehicle_types.id', '=', 'quizzes.vehicle_type_id')
            ->selectRaw('vehicle_types.name, COUNT(*) as questions')
            ->groupBy('vehicle_types.name')
            ->orderByDesc('questions')
            ->get()
            ->map(fn ($row) => ['name' => $row->name, 'questions' => (int) $row->questions])
            ->all();
    }

    /**
     * The five busiest states over the last 7 days, each with its seven daily figures (oldest
     * first), plus one combined row for everywhere else.
     *
     * The "others" row matters: five lines out of fifty-two is a readable chart but a misleading
     * one on its own, and a reader has no way to tell whether the states left out are quiet or
     * merely unlabelled. One more line answers that without crowding the plot.
     *
     * @return array{states: list<array{code: string, name: string, total: int, daily: list<int>}>, others_total: int}
     */
    private function topStates(int $limit = 5): array
    {
        $since = now()->subDays(6)->startOfDay();

        $rows = QuizAttempt::query()
            ->join('quizzes', 'quizzes.id', '=', 'quiz_attempts.quiz_id')
            ->join('states', 'states.id', '=', 'quizzes.state_id')
            ->where('quiz_attempts.created_at', '>=', $since)
            ->selectRaw('states.code, states.name, DATE(quiz_attempts.created_at) as day, COUNT(*) as count')
            ->groupBy('states.code', 'states.name', 'day')
            ->get();

        $days = collect(range(6, 0))->map(fn (int $ago) => now()->subDays($ago)->toDateString())->all();

        $byState = $rows->groupBy('code')->map(fn ($stateRows) => [
            'code' => $stateRows->first()->code,
            'name' => $stateRows->first()->name,
            'total' => (int) $stateRows->sum('count'),
            'daily' => collect($days)
                ->map(fn (string $day) => (int) ($stateRows->firstWhere('day', $day)->count ?? 0))
                ->values()
                ->all(),
        ])->sortByDesc('total')->values();

        return [
            'states' => $byState->take($limit)->values()->all(),
            'others_total' => (int) $byState->skip($limit)->sum('total'),
        ];
    }

    /**
     * Row counts per calendar day for the last 7 days (oldest first), zero-filled for days with
     * no rows — powers a dashboard sparkline without the client needing to know which dates
     * were empty. Accepts any model query builder filterable by `created_at`.
     *
     * @return list<int>
     */
    private function dailyCounts(Builder $query): array
    {
        $counts = $query
            ->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->selectRaw('DATE(created_at) as day, COUNT(*) as count')
            ->groupBy('day')
            ->pluck('count', 'day');

        return collect(range(6, 0))
            ->map(fn (int $daysAgo) => now()->subDays($daysAgo)->toDateString())
            ->map(fn (string $day) => (int) ($counts[$day] ?? 0))
            ->values()
            ->all();
    }
}
