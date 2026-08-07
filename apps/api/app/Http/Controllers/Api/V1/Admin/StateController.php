<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreStateRequest;
use App\Http\Requests\Api\V1\Admin\UpdateStateRequest;
use App\Http\Resources\Api\V1\Admin\StateResource;
use App\Models\State;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StateController extends Controller
{
    /**
     * List states (admin)
     *
     * Requires an admin account. Paginated (standard Laravel Resource collection envelope).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->integer('per_page', 15);
        $perPage = min(max($perPage, 5), 100);

        $states = State::query()
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        return StateResource::collection($states);
    }

    /**
     * Create a state (admin)
     */
    public function store(StoreStateRequest $request): JsonResponse
    {
        $state = State::query()->create($request->validated());

        return response()->json(['state' => new StateResource($state)], 201);
    }

    /**
     * Show a state (admin)
     */
    public function show(State $state): JsonResponse
    {
        return response()->json(['state' => new StateResource($state)]);
    }

    /**
     * Update a state (admin)
     */
    public function update(UpdateStateRequest $request, State $state): JsonResponse
    {
        $state->update($request->validated());

        return response()->json(['state' => new StateResource($state->fresh())]);
    }

    /**
     * Delete a state (admin)
     *
     * Returns 422 (not the DB error) if any quizzes still reference this state.
     */
    public function destroy(State $state): JsonResponse
    {
        if ($state->quizzes()->exists()) {
            return response()->json([
                'message' => __('Remove or reassign quizzes before deleting this state.'),
            ], 422);
        }

        $state->delete();

        return response()->json(['message' => __('State deleted.')]);
    }
}
