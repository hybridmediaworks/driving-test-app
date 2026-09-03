<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\HazardAttemptStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\HazardSimulatorAttemptResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HazardAttemptController extends Controller
{
    /**
     * List my hazard-simulator attempt history
     *
     * Requires authentication. The current user's completed hazard runs, most recent first, each
     * with its simulator summary and full per-hazard `breakdown` so a client can render a review
     * straight from the list. Mirrors `GET /attempts` for quizzes. Optionally filter to one
     * simulator with `?simulator=<id>`.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        $attempts = $request->user()
            ->hazardSimulatorAttempts()
            ->where('status', HazardAttemptStatus::Completed)
            ->when($request->filled('simulator'), fn ($q) => $q->where('hazard_simulator_id', $request->integer('simulator')))
            ->withReviewDetails()
            ->latest('completed_at')
            ->paginate($perPage)
            ->withQueryString();

        return HazardSimulatorAttemptResource::collection($attempts);
    }
}
