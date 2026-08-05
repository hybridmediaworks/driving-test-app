<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\QuizAttemptResource;
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
     * separate show endpoint). Guest attempts (no account) are never returned here — there is
     * currently no endpoint to look up an attempt by guest_token.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        $attempts = $request->user()
            ->quizAttempts()
            ->withReviewDetails()
            ->latest('completed_at')
            ->paginate($perPage)
            ->withQueryString();

        return QuizAttemptResource::collection($attempts);
    }
}
