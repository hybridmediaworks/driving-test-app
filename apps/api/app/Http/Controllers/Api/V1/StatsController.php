<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\AttemptStatus;
use App\Enums\FlashcardReviewStatus;
use App\Http\Controllers\Controller;
use App\Models\CheatSheet;
use App\Models\Flashcard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    /**
     * Dashboard stats (self-service)
     *
     * Requires authentication. Aggregate counts scoped to the current user — their own quiz
     * attempts and flashcard review progress, plus the current size of the study library. There is
     * no per-user cheat-sheet progress to report yet (no read/viewed tracking exists for cheat
     * sheets), so that block is library-size only, same as the flashcard "total" figure.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $attempts = $user->quizAttempts();
        $completedAttempts = (clone $attempts)->where('status', AttemptStatus::Completed);
        $averageScore = (clone $completedAttempts)->avg('score');

        $reviews = $user->flashcardReviews();

        return response()->json([
            'attempts' => [
                'total' => (clone $attempts)->count(),
                'completed' => (clone $completedAttempts)->count(),
                'in_progress' => (clone $attempts)->where('status', AttemptStatus::InProgress)->count(),
                'passed' => (clone $completedAttempts)->where('passed', true)->count(),
                'average_score' => $averageScore === null ? null : round((float) $averageScore, 1),
                'last_7_days' => (clone $attempts)->where('created_at', '>=', now()->subDays(7))->count(),
            ],
            'flashcards' => [
                'total_active' => Flashcard::query()->where('is_active', true)->count(),
                'known' => (clone $reviews)->where('status', FlashcardReviewStatus::Known)->count(),
                'unknown' => (clone $reviews)->where('status', FlashcardReviewStatus::Unknown)->count(),
            ],
            'cheat_sheets' => [
                'total_active' => CheatSheet::query()->where('is_active', true)->count(),
            ],
        ]);
    }
}
