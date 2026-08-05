<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreQuizCategoryRequest;
use App\Http\Requests\Api\V1\Admin\UpdateQuizCategoryRequest;
use App\Http\Resources\Api\V1\Admin\QuizCategoryResource;
use App\Models\QuizCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class QuizCategoryController extends Controller
{
    /**
     * List quiz categories (admin)
     *
     * Requires an admin account. Paginated (standard Laravel Resource collection envelope —
     * `data`/`links`/`meta`), includes a quizzes_count per category.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->integer('per_page', 15);
        $perPage = min(max($perPage, 5), 100);

        $categories = QuizCategory::query()
            ->withCount('quizzes')
            ->orderBy('order_no')
            ->orderBy('title')
            ->paginate($perPage)
            ->withQueryString();

        return QuizCategoryResource::collection($categories);
    }

    /**
     * Create a quiz category (admin)
     */
    public function store(StoreQuizCategoryRequest $request): JsonResponse
    {
        $category = QuizCategory::query()->create($request->validated());

        return response()->json(['category' => new QuizCategoryResource($category)], 201);
    }

    /**
     * Show a quiz category (admin)
     */
    public function show(QuizCategory $quizCategory): JsonResponse
    {
        return response()->json(['category' => new QuizCategoryResource($quizCategory)]);
    }

    /**
     * Update a quiz category (admin)
     */
    public function update(UpdateQuizCategoryRequest $request, QuizCategory $quizCategory): JsonResponse
    {
        $quizCategory->update($request->validated());

        return response()->json(['category' => new QuizCategoryResource($quizCategory->fresh())]);
    }

    /**
     * Delete a quiz category (admin)
     *
     * Returns 422 (not the DB error) if any quizzes still reference this category — reassign or
     * delete them first.
     */
    public function destroy(QuizCategory $quizCategory): JsonResponse
    {
        if ($quizCategory->quizzes()->exists()) {
            return response()->json([
                'message' => __('Remove or reassign quizzes before deleting this category.'),
            ], 422);
        }

        $quizCategory->delete();

        return response()->json(['message' => __('Category deleted.')]);
    }
}
