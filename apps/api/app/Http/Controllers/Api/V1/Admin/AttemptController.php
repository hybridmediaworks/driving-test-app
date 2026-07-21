<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\AttemptStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\QuizAttemptResource;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AttemptController extends Controller
{
    /**
     * List quiz attempts across all users (admin)
     *
     * Requires an admin account. Unlike GET /attempts (self-scoped to the caller), this returns
     * every attempt — including guest attempts, which have no `user`. Filter with `user_id`,
     * `quiz_id`, and/or `status` (in_progress|completed), most recently completed first.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = QuizAttempt::query()
            ->withReviewDetails()
            ->with('user')
            ->latest('completed_at');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        if ($request->filled('quiz_id')) {
            $query->where('quiz_id', $request->integer('quiz_id'));
        }

        if ($request->filled('status')) {
            $status = AttemptStatus::tryFrom($request->string('status')->toString());
            if ($status !== null) {
                $query->where('status', $status);
            }
        }

        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        return QuizAttemptResource::collection($query->paginate($perPage)->withQueryString());
    }
}
