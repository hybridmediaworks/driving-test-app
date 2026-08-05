<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreVehicleTypeRequest;
use App\Http\Requests\Api\V1\Admin\UpdateVehicleTypeRequest;
use App\Http\Resources\Api\V1\Admin\VehicleTypeResource;
use App\Models\VehicleType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VehicleTypeController extends Controller
{
    /**
     * List vehicle types (admin)
     *
     * Requires an admin account. Paginated (standard Laravel Resource collection envelope).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->integer('per_page', 15);
        $perPage = min(max($perPage, 5), 100);

        $vehicleTypes = VehicleType::query()
            ->orderBy('title')
            ->paginate($perPage)
            ->withQueryString();

        return VehicleTypeResource::collection($vehicleTypes);
    }

    /**
     * Create a vehicle type (admin)
     */
    public function store(StoreVehicleTypeRequest $request): JsonResponse
    {
        $vehicleType = VehicleType::query()->create($request->validated());

        return response()->json(['vehicle_type' => new VehicleTypeResource($vehicleType)], 201);
    }

    /**
     * Show a vehicle type (admin)
     */
    public function show(VehicleType $vehicleType): JsonResponse
    {
        return response()->json(['vehicle_type' => new VehicleTypeResource($vehicleType)]);
    }

    /**
     * Update a vehicle type (admin)
     */
    public function update(UpdateVehicleTypeRequest $request, VehicleType $vehicleType): JsonResponse
    {
        $vehicleType->update($request->validated());

        return response()->json(['vehicle_type' => new VehicleTypeResource($vehicleType->fresh())]);
    }

    /**
     * Delete a vehicle type (admin)
     *
     * Returns 422 (not the DB error) if any quizzes still reference this vehicle type.
     */
    public function destroy(VehicleType $vehicleType): JsonResponse
    {
        if ($vehicleType->quizzes()->exists()) {
            return response()->json([
                'message' => __('Remove or reassign quizzes before deleting this vehicle type.'),
            ], 422);
        }

        $vehicleType->delete();

        return response()->json(['message' => __('Vehicle type deleted.')]);
    }
}
