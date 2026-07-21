<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreFlashcardRequest;
use App\Http\Requests\Api\V1\Admin\UpdateFlashcardRequest;
use App\Http\Resources\Api\V1\Admin\FlashcardResource;
use App\Models\Flashcard;
use App\Models\QuizCategory;
use App\Models\State;
use App\Models\VehicleType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FlashcardController extends Controller
{
    /**
     * List flashcards (admin)
     *
     * Requires an admin account. Returns active and inactive cards together (filter with
     * `active_only=1` to hide inactive ones), plus lookup lists for the admin form's dropdowns —
     * same envelope shape as `Admin\QuizController::index`.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Flashcard::query()
            ->with(['category', 'state', 'vehicleType'])
            ->orderBy('sort_order')
            ->orderBy('id');

        if ($request->filled('quiz_category_id')) {
            $query->where('quiz_category_id', $request->integer('quiz_category_id'));
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

        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        $flashcards = $query->paginate($perPage)->withQueryString();

        return response()->json([
            'flashcards' => FlashcardResource::collection($flashcards)->response()->getData(true),
            'categories' => QuizCategory::query()->orderBy('order_no')->orderBy('title')->get(['id', 'name', 'title']),
            'states' => State::query()->orderBy('name')->get(['id', 'code', 'name']),
            'vehicle_types' => VehicleType::query()->where('is_active', true)->orderBy('title')->get(['id', 'name', 'title']),
        ]);
    }

    /**
     * Create a flashcard (admin)
     *
     * Multipart request. `image` is optional.
     */
    public function store(StoreFlashcardRequest $request): JsonResponse
    {
        $data = $request->validated();
        unset($data['image']);

        $flashcard = Flashcard::query()->create($data);

        $file = $request->file('image');
        if ($file !== null && $file->isValid()) {
            $flashcard->addMedia($file)->toMediaCollection(Flashcard::MEDIA_COLLECTION_IMAGE);
        }

        return response()->json(['flashcard' => new FlashcardResource($flashcard)], 201);
    }

    /**
     * Show a flashcard (admin)
     */
    public function show(Flashcard $flashcard): JsonResponse
    {
        $flashcard->load(['category', 'state', 'vehicleType']);

        return response()->json(['flashcard' => new FlashcardResource($flashcard)]);
    }

    /**
     * Update a flashcard (admin)
     *
     * Multipart request (send as POST with `_method=PUT` when uploading an image — see
     * `Admin\QuizController::update` for why). `remove_image=1` clears the existing image without
     * uploading a new one.
     */
    public function update(UpdateFlashcardRequest $request, Flashcard $flashcard): JsonResponse
    {
        $data = $request->validated();
        unset($data['image'], $data['remove_image']);

        $flashcard->update($data);

        $newImage = $request->file('image');
        if ($newImage !== null && $newImage->isValid()) {
            $flashcard->addMedia($newImage)->toMediaCollection(Flashcard::MEDIA_COLLECTION_IMAGE);
        } elseif ($request->boolean('remove_image')) {
            $flashcard->clearMediaCollection(Flashcard::MEDIA_COLLECTION_IMAGE);
        }

        return response()->json(['flashcard' => new FlashcardResource($flashcard->fresh())]);
    }

    /**
     * Delete a flashcard (admin)
     *
     * Unlike quizzes, there's no attempt-history guard — a flashcard review is just a per-user
     * known/unknown checkbox, not a permanent grade record, so it cascade-deletes with the card.
     */
    public function destroy(Flashcard $flashcard): JsonResponse
    {
        $flashcard->delete();

        return response()->json(['message' => __('Flashcard deleted.')]);
    }
}
