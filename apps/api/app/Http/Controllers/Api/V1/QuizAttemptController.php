<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\QuizAttemptResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class QuizAttemptController extends Controller
{
    /**
     * List my attempt history
     *
     * Requires authentication. Returns only the current user's completed attempts, most recent
     * first, each including a summary of the quiz it belongs to and its full per-question answer
     * breakdown (so a client can render a review view straight from this list — there is no
     * separate show endpoint). Optionally filter to a single quiz with `quiz` (quiz id) — e.g.
     * `?quiz=12&per_page=1` fetches just that quiz's latest attempt, which powers the "View results"
     * button on an already-completed test. Guest attempts (no account) are never returned here —
     * there is currently no endpoint to look up an attempt by guest_token.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        $attempts = $request->user()
            ->quizAttempts()
            ->when($request->filled('quiz'), fn ($q) => $q->where('quiz_id', $request->integer('quiz')))
            ->withReviewDetails()
            ->latest('completed_at')
            ->paginate($perPage)
            ->withQueryString();

        return QuizAttemptResource::collection($attempts);
    }

    /**
     * Reset my results ("Reset All Results" in the app).
     *
     * Requires authentication. Wipes the current user's quiz attempts and hazard-simulator
     * attempts — the per-question answer rows and per-click event rows cascade away via their FKs —
     * and empties their Challenge Bank, so every progress figure derived from them (pass counts,
     * average score, completion) goes back to zero. Irreversible.
     */
    public function destroyAll(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->quizAttempts()->delete();
        $user->hazardSimulatorAttempts()->delete();
        $user->challengeBankItems()->delete();

        return response()->json(['message' => 'All results have been reset.']);
    }
}
