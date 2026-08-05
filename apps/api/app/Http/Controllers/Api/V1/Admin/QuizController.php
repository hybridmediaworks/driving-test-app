<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Quiz\GenerateUniqueSlug;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreQuizRequest;
use App\Http\Requests\Api\V1\Admin\UpdateQuizRequest;
use App\Http\Resources\Api\V1\Admin\QuizResource;
use App\Models\Quiz;
use App\Models\QuizCategory;
use App\Models\QuizType;
use App\Models\State;
use App\Models\VehicleType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    public function __construct(
        private readonly GenerateUniqueSlug $generateUniqueSlug,
    ) {}

    /**
     * List quizzes (admin)
     *
     * Requires an admin account. `quizzes` uses the standard Laravel Resource collection
     * envelope (`data`/`links`/`meta`). Returns active and inactive quizzes together (filter with
     * `active_only=1` to hide inactive ones), plus the full category/type/state/vehicle-type
     * lookup lists in the same response — built for populating an admin form's dropdowns without
     * a second request. Lookup lists are intentionally lean (id/name/title only, no timestamps) —
     * a dropdown has no use for a category's created_at, so they stay plain column-selected
     * queries rather than going through the (heavier) full Resources used elsewhere.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Quiz::query()
            ->with(['category', 'quizType', 'state', 'vehicleType'])
            ->orderBy('order_no')
            ->orderBy('title');

        if ($request->filled('quiz_category_id')) {
            $query->where('quiz_category_id', $request->integer('quiz_category_id'));
        }

        if ($request->filled('quiz_type_id')) {
            $query->where('quiz_type_id', $request->integer('quiz_type_id'));
        }

        if ($request->filled('state_id')) {
            $query->where('state_id', $request->integer('state_id'));
        }

        if ($request->filled('vehicle_type_id')) {
            $query->where('vehicle_type_id', $request->integer('vehicle_type_id'));
        }

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        $perPage = $request->integer('per_page', 15);
        $perPage = min(max($perPage, 5), 100);

        $quizzes = $query->paginate($perPage)->withQueryString();

        return response()->json([
            'quizzes' => QuizResource::collection($quizzes)->response()->getData(true),
            'categories' => QuizCategory::query()->orderBy('order_no')->orderBy('title')->get(['id', 'name', 'title']),
            'quiz_types' => QuizType::query()->orderBy('title')->get(['id', 'name', 'title']),
            'states' => State::query()->orderBy('name')->get(['id', 'code', 'name']),
            'vehicle_types' => VehicleType::query()->where('is_active', true)->orderBy('title')->get(['id', 'name', 'title']),
            'filters' => [
                'quiz_category_id' => $request->input('quiz_category_id'),
                'quiz_type_id' => $request->input('quiz_type_id'),
                'state_id' => $request->input('state_id'),
                'vehicle_type_id' => $request->input('vehicle_type_id'),
                'active_only' => $request->boolean('active_only'),
            ],
        ]);
    }

    /**
     * Create a quiz (admin)
     *
     * Multipart request. `cover_image` is optional; `slug` is auto-generated from `title` (and
     * de-duplicated) if omitted.
     */
    public function store(StoreQuizRequest $request): JsonResponse
    {
        $data = $request->validated();
        unset($data['cover_image']);

        $data['slug'] = ($this->generateUniqueSlug)(
            'quizzes',
            blank($data['slug'] ?? null) ? $data['title'] : $data['slug'],
        );

        $quiz = Quiz::query()->create($data);

        $file = $request->file('cover_image');
        if ($file !== null && $file->isValid()) {
            $quiz->addMedia($file)->toMediaCollection(Quiz::MEDIA_COLLECTION_COVER);
        }

        return response()->json(['quiz' => new QuizResource($quiz)], 201);
    }

    /**
     * Show a quiz (admin)
     */
    public function show(Quiz $quiz): JsonResponse
    {
        $quiz->loadCount('quizQuestions');
        $quiz->load(['category', 'quizType', 'state', 'vehicleType']);

        return response()->json(['quiz' => new QuizResource($quiz)]);
    }

    /**
     * Update a quiz (admin)
     *
     * Multipart request (Laravel doesn't parse multipart on PUT, so send as POST with
     * `_method=PUT`). Uploading `cover_image` replaces the existing cover; `remove_cover_image=1`
     * clears it without uploading a new one.
     */
    public function update(UpdateQuizRequest $request, Quiz $quiz): JsonResponse
    {
        $data = $request->validated();
        unset($data['cover_image'], $data['remove_cover_image']);

        $data['slug'] = ($this->generateUniqueSlug)(
            'quizzes',
            blank($data['slug'] ?? null) ? $data['title'] : $data['slug'],
            $quiz->id,
        );

        $quiz->update($data);

        $newCover = $request->file('cover_image');
        if ($newCover !== null && $newCover->isValid()) {
            $quiz->addMedia($newCover)->toMediaCollection(Quiz::MEDIA_COLLECTION_COVER);
        } elseif ($request->boolean('remove_cover_image')) {
            $quiz->clearMediaCollection(Quiz::MEDIA_COLLECTION_COVER);
        }

        return response()->json(['quiz' => new QuizResource($quiz->fresh())]);
    }

    /**
     * Delete a quiz (admin)
     *
     * Returns 422 (not the DB error) if the quiz has any attempt history — deactivate it
     * (`is_active=false`) instead of deleting, to preserve users' scores/progress.
     */
    public function destroy(Quiz $quiz): JsonResponse
    {
        if ($quiz->attempts()->exists()) {
            return response()->json([
                'message' => __('This quiz has attempt history and cannot be deleted. Deactivate it instead.'),
            ], 422);
        }

        $quiz->delete();

        return response()->json(['message' => __('Quiz deleted.')]);
    }
}
