<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreQuizCategoryRequest;
use App\Http\Requests\Admin\UpdateQuizCategoryRequest;
use App\Models\QuizCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuizCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 15);
        $perPage = min(max($perPage, 5), 100);

        return response()->json(
            QuizCategory::query()
                ->withCount('quizzes')
                ->orderBy('order_no')
                ->orderBy('title')
                ->paginate($perPage)
                ->withQueryString(),
        );
    }

    public function store(StoreQuizCategoryRequest $request): JsonResponse
    {
        $category = QuizCategory::query()->create($request->validated());

        return response()->json(['category' => $category], 201);
    }

    public function show(QuizCategory $quizCategory): JsonResponse
    {
        return response()->json(['category' => $quizCategory]);
    }

    public function update(UpdateQuizCategoryRequest $request, QuizCategory $quizCategory): JsonResponse
    {
        $quizCategory->update($request->validated());

        return response()->json(['category' => $quizCategory->fresh()]);
    }

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
