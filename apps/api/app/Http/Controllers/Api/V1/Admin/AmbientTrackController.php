<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreAmbientTrackRequest;
use App\Http\Requests\Api\V1\Admin\UpdateAmbientTrackRequest;
use App\Http\Resources\Api\V1\Admin\AmbientTrackResource;
use App\Models\AmbientTrack;
use App\Models\QuizCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AmbientTrackController extends Controller
{
    /**
     * List ambient tracks (admin)
     *
     * Requires an admin account. Returns active and inactive tracks together (filter with
     * `active_only=1` to hide inactive ones) plus the category lookup list for the admin form's
     * dropdown — same envelope shape as `Admin\VideoController::index`.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AmbientTrack::query()
            ->with('category')
            ->orderBy('order_no')
            ->orderBy('title');

        if ($request->filled('quiz_category_id')) {
            $query->where('quiz_category_id', $request->integer('quiz_category_id'));
        }

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        $tracks = $query->paginate($perPage)->withQueryString();

        return response()->json([
            'tracks' => AmbientTrackResource::collection($tracks)->response()->getData(true),
            'categories' => QuizCategory::query()->orderBy('order_no')->orderBy('title')->get(['id', 'name', 'title']),
        ]);
    }

    /**
     * Create an ambient track (admin)
     *
     * Exactly one of `external_url` or `disk`+`path` should be set — validated in
     * `StoreAmbientTrackRequest`. No file upload — the audio file is uploaded to the disk
     * out-of-band, same as videos.
     */
    public function store(StoreAmbientTrackRequest $request): JsonResponse
    {
        $track = AmbientTrack::query()->create($request->validated());

        return response()->json(['track' => new AmbientTrackResource($track)], 201);
    }

    /**
     * Show an ambient track (admin)
     */
    public function show(AmbientTrack $ambientTrack): JsonResponse
    {
        $ambientTrack->load('category');

        return response()->json(['track' => new AmbientTrackResource($ambientTrack)]);
    }

    /**
     * Update an ambient track (admin)
     */
    public function update(UpdateAmbientTrackRequest $request, AmbientTrack $ambientTrack): JsonResponse
    {
        $ambientTrack->update($request->validated());

        return response()->json(['track' => new AmbientTrackResource($ambientTrack->fresh()->load('category'))]);
    }

    /**
     * Delete an ambient track (admin)
     */
    public function destroy(AmbientTrack $ambientTrack): JsonResponse
    {
        $ambientTrack->delete();

        return response()->json(['message' => __('Ambient track deleted.')]);
    }
}
