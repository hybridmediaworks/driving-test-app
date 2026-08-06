<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Quiz\GenerateUniqueSlug;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreVideoRequest;
use App\Http\Requests\Api\V1\Admin\UpdateVideoRequest;
use App\Http\Resources\Api\V1\Admin\VideoResource;
use App\Models\QuizCategory;
use App\Models\State;
use App\Models\VehicleType;
use App\Models\Video;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VideoController extends Controller
{
    public function __construct(
        private readonly GenerateUniqueSlug $generateUniqueSlug,
    ) {}

    /**
     * List videos (admin)
     *
     * Requires an admin account. Returns active and inactive videos together (filter with
     * `active_only=1` to hide inactive ones), plus lookup lists for the admin form's dropdowns —
     * same envelope shape as `Admin\CheatSheetController::index`.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Video::query()
            ->with(['category', 'state', 'vehicleType'])
            ->orderBy('order_no')
            ->orderBy('title');

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

        $videos = $query->paginate($perPage)->withQueryString();

        return response()->json([
            'videos' => VideoResource::collection($videos)->response()->getData(true),
            'categories' => QuizCategory::query()->orderBy('order_no')->orderBy('title')->get(['id', 'name', 'title']),
            'states' => State::query()->orderBy('name')->get(['id', 'code', 'name']),
            'vehicle_types' => VehicleType::query()->where('is_active', true)->orderBy('title')->get(['id', 'name', 'title']),
        ]);
    }

    /**
     * Create a video (admin)
     *
     * Multipart request. `thumbnail` is optional. Exactly one of `external_url` or `disk`+`path`
     * should be set — validated in `StoreVideoRequest`.
     */
    public function store(StoreVideoRequest $request): JsonResponse
    {
        $data = $request->validated();
        unset($data['thumbnail']);

        $data['slug'] = ($this->generateUniqueSlug)(
            'videos',
            blank($data['slug'] ?? null) ? $data['title'] : $data['slug'],
        );

        $video = Video::query()->create($data);

        $file = $request->file('thumbnail');
        if ($file !== null && $file->isValid()) {
            $video->addMedia($file)->toMediaCollection(Video::MEDIA_COLLECTION_THUMBNAIL);
        }

        return response()->json(['video' => new VideoResource($video)], 201);
    }

    /**
     * Show a video (admin)
     */
    public function show(Video $video): JsonResponse
    {
        $video->load(['category', 'state', 'vehicleType']);

        return response()->json(['video' => new VideoResource($video)]);
    }

    /**
     * Update a video (admin)
     *
     * Multipart request (send as POST with `_method=PUT` when uploading a thumbnail).
     * `remove_thumbnail=1` clears the existing thumbnail without uploading a new one.
     */
    public function update(UpdateVideoRequest $request, Video $video): JsonResponse
    {
        $data = $request->validated();
        unset($data['thumbnail'], $data['remove_thumbnail']);

        $data['slug'] = ($this->generateUniqueSlug)(
            'videos',
            blank($data['slug'] ?? null) ? $data['title'] : $data['slug'],
            $video->id,
        );

        $video->update($data);

        $newThumbnail = $request->file('thumbnail');
        if ($newThumbnail !== null && $newThumbnail->isValid()) {
            $video->addMedia($newThumbnail)->toMediaCollection(Video::MEDIA_COLLECTION_THUMBNAIL);
        } elseif ($request->boolean('remove_thumbnail')) {
            $video->clearMediaCollection(Video::MEDIA_COLLECTION_THUMBNAIL);
        }

        return response()->json(['video' => new VideoResource($video->fresh()->load(['category', 'state', 'vehicleType']))]);
    }

    /**
     * Delete a video (admin)
     */
    public function destroy(Video $video): JsonResponse
    {
        $video->delete();

        return response()->json(['message' => __('Video deleted.')]);
    }
}
