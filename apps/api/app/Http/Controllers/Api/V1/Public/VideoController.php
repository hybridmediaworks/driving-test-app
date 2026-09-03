<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Public\VideoResource;
use App\Models\Video;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class VideoController extends Controller
{
    /**
     * List videos
     *
     * Public — no authentication required. Returns only active videos, paginated. Optionally
     * filter by `state` (state code), `vehicle_type` (name), `category` (name), and `test_track` —
     * same filter semantics as `Public\CheatSheetController::index`, including the "null scoping
     * FK = applies universally" behavior.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        $query = Video::query()
            ->where('is_active', true)
            ->with(['category', 'state', 'vehicleType', 'hazardSimulator'])
            ->orderBy('order_no')
            ->orderBy('title');

        if ($request->filled('state')) {
            $code = $request->string('state')->toString();
            $query->where(fn ($q) => $q->whereNull('state_id')->orWhereHas('state', fn ($q2) => $q2->where('code', $code)));
        }

        if ($request->filled('vehicle_type')) {
            $name = $request->string('vehicle_type')->toString();
            $query->where(fn ($q) => $q->whereNull('vehicle_type_id')->orWhereHas('vehicleType', fn ($q2) => $q2->where('name', $name)));
        }

        if ($request->filled('category')) {
            $name = $request->string('category')->toString();
            $query->where(fn ($q) => $q->whereNull('quiz_category_id')->orWhereHas('category', fn ($q2) => $q2->where('name', $name)));
        }

        if ($request->filled('test_track')) {
            $query->where('test_track', $request->string('test_track'));
        }

        return VideoResource::collection($query->paginate($perPage)->withQueryString());
    }

    /**
     * Show a video
     *
     * Public — no authentication required. The teaser (title/description/thumbnail/duration) is
     * always visible. `url` is included only if the caller can watch (`locked: false`); otherwise
     * `url` is omitted and `locked: true`, same locked-teaser shape as cheat sheets/quizzes.
     */
    public function show(Request $request, Video $video): JsonResponse
    {
        $this->authorize('view', $video);

        $video->load(['category', 'state', 'vehicleType', 'hazardSimulator']);
        // No auth:sanctum middleware on this route (guests may browse) — resolve explicitly.
        $unlocked = Gate::forUser($request->user('sanctum'))->allows('watch', $video);

        return response()->json([
            'video' => new VideoResource($video),
            'locked' => ! $unlocked,
            'url' => $unlocked ? $video->url : null,
        ]);
    }
}
