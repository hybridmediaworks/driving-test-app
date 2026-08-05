<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreQuizTypeRequest;
use App\Http\Requests\Api\V1\Admin\UpdateQuizTypeRequest;
use App\Http\Resources\Api\V1\Admin\QuizTypeResource;
use App\Models\QuizType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class QuizTypeController extends Controller
{
    /**
     * List quiz types (admin)
     *
     * Requires an admin account. Paginated (standard Laravel Resource collection envelope).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->integer('per_page', 15);
        $perPage = min(max($perPage, 5), 100);

        $quizTypes = QuizType::query()
            ->orderBy('title')
            ->paginate($perPage)
            ->withQueryString();

        return QuizTypeResource::collection($quizTypes);
    }

    /**
     * Create a quiz type (admin)
     */
    public function store(StoreQuizTypeRequest $request): JsonResponse
    {
        $quizType = QuizType::query()->create($request->validated());

        return response()->json(['quiz_type' => new QuizTypeResource($quizType)], 201);
    }

    /**
     * Show a quiz type (admin)
     */
    public function show(QuizType $quizType): JsonResponse
    {
        return response()->json(['quiz_type' => new QuizTypeResource($quizType)]);
    }

    /**
     * Update a quiz type (admin)
     */
    public function update(UpdateQuizTypeRequest $request, QuizType $quizType): JsonResponse
    {
        $quizType->update($request->validated());

        return response()->json(['quiz_type' => new QuizTypeResource($quizType->fresh())]);
    }

    /**
     * Delete a quiz type (admin)
     *
     * Returns 422 (not the DB error) if any quizzes still reference this quiz type.
     */
    public function destroy(QuizType $quizType): JsonResponse
    {
        if ($quizType->quizzes()->exists()) {
            return response()->json([
                'message' => __('Remove or reassign quizzes before deleting this quiz type.'),
            ], 422);
        }

        $quizType->delete();

        return response()->json(['message' => __('Quiz type deleted.')]);
    }
}
