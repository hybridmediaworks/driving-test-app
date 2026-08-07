<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Handbook\SyncHandbookChapters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreHandbookRequest;
use App\Http\Requests\Api\V1\Admin\UpdateHandbookRequest;
use App\Http\Resources\Api\V1\Admin\HandbookResource;
use App\Models\Handbook;
use App\Models\State;
use App\Models\VehicleType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HandbookController extends Controller
{
    public function __construct(
        private readonly SyncHandbookChapters $syncChapters,
    ) {}

    /**
     * List handbooks (admin)
     *
     * Requires an admin account. One row per state x vehicle_type x language (enforced by a DB
     * unique constraint), plus lookup lists for the admin form's dropdowns.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Handbook::query()
            ->with(['state', 'vehicleType'])
            ->withCount('chapters')
            ->orderBy('title');

        if ($request->filled('state_id')) {
            $query->where('state_id', $request->integer('state_id'));
        }

        if ($request->filled('vehicle_type_id')) {
            $query->where('vehicle_type_id', $request->integer('vehicle_type_id'));
        }

        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        $handbooks = $query->paginate($perPage)->withQueryString();

        return response()->json([
            'handbooks' => HandbookResource::collection($handbooks)->response()->getData(true),
            'states' => State::query()->orderBy('name')->get(['id', 'code', 'name']),
            'vehicle_types' => VehicleType::query()->where('is_active', true)->orderBy('title')->get(['id', 'name', 'title']),
        ]);
    }

    /**
     * Create a handbook (admin)
     *
     * Multipart request. `chapters` is a bracket-keyed array of `{ title, sections: [{ heading,
     * content }] }` — two levels deeper than a cheat sheet's flat `sections`, same replace-on-save
     * shape otherwise. `pdf` is optional.
     */
    public function store(StoreHandbookRequest $request): JsonResponse
    {
        $data = $request->validated();
        $chapters = $data['chapters'];
        unset($data['chapters'], $data['pdf']);

        $handbook = DB::transaction(function () use ($data, $chapters): Handbook {
            $handbook = Handbook::query()->create($data);
            ($this->syncChapters)($handbook, $chapters);

            return $handbook;
        });

        $file = $request->file('pdf');
        if ($file !== null && $file->isValid()) {
            $handbook->addMedia($file)->toMediaCollection(Handbook::MEDIA_COLLECTION_PDF);
        }

        return response()->json(['handbook' => new HandbookResource($handbook->load('chapters.sections'))], 201);
    }

    /**
     * Show a handbook (admin)
     */
    public function show(Handbook $handbook): JsonResponse
    {
        $handbook->load(['state', 'vehicleType', 'chapters.sections']);

        return response()->json(['handbook' => new HandbookResource($handbook)]);
    }

    /**
     * Update a handbook (admin)
     *
     * Multipart request (send as POST with `_method=PUT` when uploading a PDF). `chapters` fully
     * replaces the existing chapter/section set.
     */
    public function update(UpdateHandbookRequest $request, Handbook $handbook): JsonResponse
    {
        $data = $request->validated();
        $chapters = $data['chapters'];
        unset($data['chapters'], $data['pdf']);

        DB::transaction(function () use ($handbook, $data, $chapters): void {
            $handbook->update($data);
            ($this->syncChapters)($handbook, $chapters);
        });

        $newPdf = $request->file('pdf');
        if ($newPdf !== null && $newPdf->isValid()) {
            $handbook->addMedia($newPdf)->toMediaCollection(Handbook::MEDIA_COLLECTION_PDF);
        }

        return response()->json(['handbook' => new HandbookResource($handbook->fresh()->load('chapters.sections'))]);
    }

    /**
     * Delete a handbook (admin)
     *
     * Chapters/sections cascade-delete with it.
     */
    public function destroy(Handbook $handbook): JsonResponse
    {
        $handbook->delete();

        return response()->json(['message' => __('Handbook deleted.')]);
    }
}
