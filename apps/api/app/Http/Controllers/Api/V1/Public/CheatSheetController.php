<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Actions\CheatSheet\GenerateCheatSheetPdf;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Public\CheatSheetResource;
use App\Http\Resources\Api\V1\Public\CheatSheetSectionResource;
use App\Models\CheatSheet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class CheatSheetController extends Controller
{
    public function __construct(
        private readonly GenerateCheatSheetPdf $generatePdf,
    ) {}

    /**
     * List cheat sheets
     *
     * Public — no authentication required. Returns only active sheets, paginated. Optionally
     * filter by `state` (state code), `vehicle_type` (name), and `category` (name) — same filter
     * semantics as `Public\QuizController::index`, including the "null scoping FK = applies
     * universally" behavior used by `Public\FlashcardController`.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        $query = CheatSheet::query()
            ->where('is_active', true)
            ->with(['category', 'state', 'vehicleType'])
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

        return CheatSheetResource::collection($query->paginate($perPage)->withQueryString());
    }

    /**
     * Show a cheat sheet
     *
     * Public — no authentication required. The teaser (title/summary/cover) is always visible.
     * `sections` is included only if the caller can read the full sheet (`locked: false`);
     * otherwise `sections` is omitted entirely and `locked: true`, same shape planned for premium
     * quizzes in the subscription roadmap.
     */
    public function show(Request $request, CheatSheet $cheatSheet): JsonResponse
    {
        $this->authorize('view', $cheatSheet);

        $cheatSheet->load(['category', 'state', 'vehicleType']);
        // No auth:sanctum middleware on this route (guests may browse) — Gate's ambient/
        // default-guard user resolution never sees the Sanctum token, so resolve explicitly.
        $unlocked = Gate::forUser($request->user('sanctum'))->allows('readFull', $cheatSheet);

        return response()->json([
            'cheat_sheet' => new CheatSheetResource($cheatSheet),
            'locked' => ! $unlocked,
            'sections' => $unlocked ? CheatSheetSectionResource::collection($cheatSheet->sections) : null,
        ]);
    }

    /**
     * Download a cheat sheet as PDF
     *
     * Requires the caller to be able to read the full sheet — same gate as the `sections` field
     * on `show`. The PDF is rendered on first request and cached; see `GenerateCheatSheetPdf`.
     */
    public function download(Request $request, CheatSheet $cheatSheet): BinaryFileResponse
    {
        // Same reason as show() above — no auth:sanctum middleware on this route.
        Gate::forUser($request->user('sanctum'))->authorize('readFull', $cheatSheet);

        $media = ($this->generatePdf)($cheatSheet);

        return response()->download($media->getPath(), Str::slug($cheatSheet->title).'.pdf');
    }
}
