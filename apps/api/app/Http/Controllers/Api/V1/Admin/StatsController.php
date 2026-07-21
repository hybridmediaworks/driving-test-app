<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\AttemptStatus;
use App\Enums\PassGuaranteeClaimStatus;
use App\Http\Controllers\Controller;
use App\Models\CheatSheet;
use App\Models\FamilyGroup;
use App\Models\Flashcard;
use App\Models\FlashcardReview;
use App\Models\PassGuaranteeClaim;
use App\Models\Plan;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizCategory;
use App\Models\QuizQuestion;
use App\Models\Subscription;
use App\Models\User;
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
                'new_last_7_days' => User::query()->where('created_at', '>=', now()->subDays(7))->count(),
            ],
            'quizzes' => [
                'total' => Quiz::query()->count(),
                'active' => Quiz::query()->where('is_active', true)->count(),
                'categories' => QuizCategory::query()->count(),
                'questions' => QuizQuestion::query()->count(),
            ],
            'attempts' => [
                'total' => QuizAttempt::query()->count(),
                'completed' => (clone $completedAttempts)->count(),
                'in_progress' => QuizAttempt::query()->where('status', AttemptStatus::InProgress)->count(),
                'average_score' => $averageScore === null ? null : round((float) $averageScore, 1),
                'last_7_days' => QuizAttempt::query()->where('created_at', '>=', now()->subDays(7))->count(),
            ],
            'content' => [
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
}
