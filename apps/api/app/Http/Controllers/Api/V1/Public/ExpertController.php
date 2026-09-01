<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Public\ExpertResource;
use App\Http\Resources\Api\V1\Public\ExpertSummaryResource;
use App\Models\Expert;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ExpertController extends Controller
{
    /**
     * List experts
     *
     * Public — no authentication. The published roster, in display order, in the compact shape the
     * "verified by" trust badges on state and quiz pages need. Not paginated (there are only ever a
     * handful).
     */
    public function index(): JsonResponse
    {
        $experts = Expert::query()->published()->ordered()->get();

        return response()->json(['experts' => ExpertSummaryResource::collection($experts)]);
    }

    /**
     * Show an expert
     *
     * Public — no authentication. The full profile behind /experts/{slug}: bio, credentials,
     * and the ordered content sections (Education, Methodology, Publications, …). An unpublished
     * expert 404s.
     */
    public function show(Expert $expert): JsonResponse
    {
        abort_unless($expert->is_published, Response::HTTP_NOT_FOUND);

        return response()->json(['expert' => new ExpertResource($expert)]);
    }
}
