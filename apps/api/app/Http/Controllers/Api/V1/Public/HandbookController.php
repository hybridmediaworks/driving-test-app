<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Public\HandbookResource;
use App\Models\Handbook;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HandbookController extends Controller
{
    /**
     * List handbooks
     *
     * Public — no authentication required. Optionally filter by `state` (state code) and
     * `vehicle_type` (name) — unlike quizzes/cheat-sheets/videos, both are exact-match only, no
     * "null = applies universally" fallback, since every real handbook belongs to exactly one
     * state and vehicle type.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        $query = Handbook::query()
            ->with(['state', 'vehicleType'])
            ->orderBy('title');

        if ($request->filled('state')) {
            $code = $request->string('state')->toString();
            $query->whereHas('state', fn ($q) => $q->where('code', $code));
        }

        if ($request->filled('vehicle_type')) {
            $name = $request->string('vehicle_type')->toString();
            $query->whereHas('vehicleType', fn ($q) => $q->where('name', $name));
        }

        return HandbookResource::collection($query->paginate($perPage)->withQueryString());
    }

    /**
     * Show a handbook
     *
     * Public — no authentication required. Includes chapters/sections directly — not premium
     * gated (see HandbookResource).
     */
    public function show(Handbook $handbook): JsonResponse
    {
        $handbook->load(['state', 'vehicleType', 'chapters.sections']);

        return response()->json(['handbook' => new HandbookResource($handbook)]);
    }
}
