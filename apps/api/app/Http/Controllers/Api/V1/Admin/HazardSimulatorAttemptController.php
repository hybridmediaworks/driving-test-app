<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\HazardAttemptStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\HazardSimulatorAttemptResource;
use App\Models\HazardSimulatorAttempt;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Hazard-run history across every user — QA + analytics. Mirrors Admin\AttemptController (quizzes):
 * includes guest attempts (no `user`), reuses the same resource as the self-service endpoint.
 */
class HazardSimulatorAttemptController extends Controller
{
    /**
     * List hazard-simulator attempts (admin)
     *
     * Most recently completed first. Filter with `user_id`, `hazard_simulator_id`, and/or
     * `status` (in_progress|completed|abandoned). Each row carries the full per-hazard `breakdown`.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = HazardSimulatorAttempt::query()
            ->withReviewDetails()
            ->with('user')
            ->latest('completed_at');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        if ($request->filled('hazard_simulator_id')) {
            $query->where('hazard_simulator_id', $request->integer('hazard_simulator_id'));
        }

        if ($request->filled('status')) {
            $status = HazardAttemptStatus::tryFrom($request->string('status')->toString());
            if ($status !== null) {
                $query->where('status', $status);
            }
        }

        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        return HazardSimulatorAttemptResource::collection($query->paginate($perPage)->withQueryString());
    }
}
