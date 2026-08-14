<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Actions\AmbientMusic\ListAmbientTracks;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AmbientTrackController extends Controller
{
    public function __construct(private readonly ListAmbientTracks $listTracks) {}

    /**
     * List ambient music tracks
     *
     * Public — no authentication required. Admin-managed background-music loops for the quiz
     * Settings panel. Optionally filter with `category` (name, e.g. `road-signs` — same
     * convention as `GET /quizzes?category=`) to get that category's tracks plus every
     * uncategorized/global track; omit it to get every active track.
     */
    public function index(Request $request): JsonResponse
    {
        $category = $request->filled('category') ? $request->string('category')->toString() : null;

        return response()->json(['tracks' => ($this->listTracks)($category)]);
    }
}
