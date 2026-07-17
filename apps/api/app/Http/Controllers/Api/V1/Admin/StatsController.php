<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\AttemptStatus;
use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizCategory;
use App\Models\QuizQuestion;
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
        ]);
    }
}
