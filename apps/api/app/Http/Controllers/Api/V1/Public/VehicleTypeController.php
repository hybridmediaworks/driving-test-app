<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Public\VehicleTypeResource;
use App\Models\VehicleType;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VehicleTypeController extends Controller
{
    /**
     * List vehicle types
     *
     * Public — no authentication required. Returns only active vehicle types, alphabetical by
     * title, not paginated — this is a short fixed list. Use `name` as the value for the
     * `vehicle_type` filter on `GET /quizzes`.
     */
    public function index(): AnonymousResourceCollection
    {
        return VehicleTypeResource::collection(
            VehicleType::query()->where('is_active', true)->orderBy('title')->get()
        );
    }
}
