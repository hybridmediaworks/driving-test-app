<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\CheatSheet\SyncCheatSheetSections;
use App\Actions\Quiz\GenerateUniqueSlug;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreCheatSheetRequest;
use App\Http\Requests\Api\V1\Admin\UpdateCheatSheetRequest;
use App\Http\Resources\Api\V1\Admin\CheatSheetResource;
use App\Models\CheatSheet;
use App\Models\QuizCategory;
use App\Models\State;
use App\Models\VehicleType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheatSheetController extends Controller
{
    public function __construct(
        private readonly GenerateUniqueSlug $generateUniqueSlug,
        private readonly SyncCheatSheetSections $syncSections,
    ) {}

    /**
     * List cheat sheets (admin)
     *
     * Requires an admin account. Returns active and inactive sheets together (filter with
     * `active_only=1` to hide inactive ones), plus lookup lists for the admin form's dropdowns —
     * same envelope shape as `Admin\QuizController::index`.
     */
    public function index(Request $request): JsonResponse
    {
        $query = CheatSheet::query()
            ->with(['category', 'state', 'vehicleType'])
            ->withCount('sections')
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

        $cheatSheets = $query->paginate($perPage)->withQueryString();

        return response()->json([
            'cheat_sheets' => CheatSheetResource::collection($cheatSheets)->response()->getData(true),
            'categories' => QuizCategory::query()->orderBy('order_no')->orderBy('title')->get(['id', 'name', 'title']),
            'states' => State::query()->orderBy('name')->get(['id', 'code', 'name']),
            'vehicle_types' => VehicleType::query()->where('is_active', true)->orderBy('title')->get(['id', 'name', 'title']),
        ]);
    }

    /**
     * Create a cheat sheet (admin)
     *
     * Multipart request. `sections` is a bracket-keyed array (`sections[0][heading]`, etc.), at
     * least one required — same shape as a quiz question's `answers`. `cover_image` is optional.
     */
    public function store(StoreCheatSheetRequest $request): JsonResponse
    {
        $data = $request->validated();
        $sections = $data['sections'];
        unset($data['sections'], $data['cover_image']);

        $data['slug'] = ($this->generateUniqueSlug)(
            'cheat_sheets',
            blank($data['slug'] ?? null) ? $data['title'] : $data['slug'],
        );

        $cheatSheet = DB::transaction(function () use ($data, $sections): CheatSheet {
            $cheatSheet = CheatSheet::query()->create($data);
            ($this->syncSections)($cheatSheet, $sections);

            return $cheatSheet;
        });

        $file = $request->file('cover_image');
        if ($file !== null && $file->isValid()) {
            $cheatSheet->addMedia($file)->toMediaCollection(CheatSheet::MEDIA_COLLECTION_COVER);
        }

        return response()->json(['cheat_sheet' => new CheatSheetResource($cheatSheet->load('sections'))], 201);
    }

    /**
     * Show a cheat sheet (admin)
     */
    public function show(CheatSheet $cheatSheet): JsonResponse
    {
        $cheatSheet->load(['category', 'state', 'vehicleType', 'sections']);

        return response()->json(['cheat_sheet' => new CheatSheetResource($cheatSheet)]);
    }

    /**
     * Update a cheat sheet (admin)
     *
     * Multipart request (send as POST with `_method=PUT` when uploading a cover image). `sections`
     * fully replaces the existing section set, same as `answers` on a quiz question update.
     * `remove_cover_image=1` clears the existing cover without uploading a new one.
     */
    public function update(UpdateCheatSheetRequest $request, CheatSheet $cheatSheet): JsonResponse
    {
        $data = $request->validated();
        $sections = $data['sections'];
        unset($data['sections'], $data['cover_image'], $data['remove_cover_image']);

        $data['slug'] = ($this->generateUniqueSlug)(
            'cheat_sheets',
            blank($data['slug'] ?? null) ? $data['title'] : $data['slug'],
            $cheatSheet->id,
        );

        DB::transaction(function () use ($cheatSheet, $data, $sections): void {
            $cheatSheet->update($data);
            ($this->syncSections)($cheatSheet, $sections);
        });

        $newCover = $request->file('cover_image');
        if ($newCover !== null && $newCover->isValid()) {
            $cheatSheet->addMedia($newCover)->toMediaCollection(CheatSheet::MEDIA_COLLECTION_COVER);
        } elseif ($request->boolean('remove_cover_image')) {
            $cheatSheet->clearMediaCollection(CheatSheet::MEDIA_COLLECTION_COVER);
        }

        return response()->json(['cheat_sheet' => new CheatSheetResource($cheatSheet->fresh()->load('sections'))]);
    }

    /**
     * Delete a cheat sheet (admin)
     *
     * Sections cascade-delete with it (pure child rows, same as quiz answers).
     */
    public function destroy(CheatSheet $cheatSheet): JsonResponse
    {
        $cheatSheet->delete();

        return response()->json(['message' => __('Cheat sheet deleted.')]);
    }
}
