<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Public\QuizCategoryResource;
use App\Models\QuizCategory;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class QuizCategoryController extends Controller
{
    /**
     * List quiz categories
     *
     * Public — no authentication required. Returns only active categories, in the admin-defined
     * display order, not paginated — this is a short fixed list. Use `name` as the value for the
     * `category` filter on `GET /quizzes`.
     */
    public function index(): AnonymousResourceCollection
    {
        return QuizCategoryResource::collection(
            QuizCategory::query()->where('is_active', true)->orderBy('order_no')->orderBy('title')->get()
        );
    }
}
