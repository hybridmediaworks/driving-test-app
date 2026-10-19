<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Public\FlashcardResource;
use App\Models\Flashcard;
use App\Models\QuizCategory;
use App\Support\LikeSearch;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class FlashcardController extends Controller
{
    /**
     * Maximum cards returned by `study` in one request — a study session is meant to be worked
     * through in one sitting, not paginated like a browse list.
     */
    private const MAX_STUDY_SET = 300;

    /**
     * Browse flashcards
     *
     * Public — no authentication required. Paginated. Optionally filter by `state` (state code),
     * `vehicle_type` (name), and `category` (name) — same filter semantics as
     * `Public\QuizController::index`. `back_text`/`image_url` are withheld for premium cards the
     * caller isn't entitled to (see `FlashcardResource`); the card still appears so the browse
     * list can show real counts as a teaser.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        $query = $this->filteredQuery($request);

        return FlashcardResource::collection($query->paginate($perPage)->withQueryString());
    }

    /**
     * Get a full study-session set
     *
     * Public — no authentication required, but locked (premium) cards in the set have their
     * `back_text`/`image_url` withheld same as everywhere else; the caller sees the card exists
     * but can't flip it. Same filters as `index`, capped at 300 cards, no pagination — the whole
     * set is meant to be fetched once per study session.
     */
    public function study(Request $request): JsonResponse
    {
        $query = $this->filteredQuery($request);

        $flashcards = $query->limit(self::MAX_STUDY_SET)->get();

        return response()->json([
            'data' => FlashcardResource::collection($flashcards),
        ]);
    }

    /**
     * List flashcard sets
     *
     * Public — no authentication required. A "set" is the cards sharing one category and topic (a
     * card with no topic is its own category-wide set). Returns each set's category, topic and card
     * count so the state page's Flashcard Mode can show real sets instead of one flat pile. Takes
     * the same `state` and `vehicle_type` filters as `index`; `category` is ignored on purpose,
     * since the point is to see every category.
     */
    public function sets(Request $request): JsonResponse
    {
        $rows = $this->filteredQuery($request->duplicate(Arr::except($request->query(), ['category', 'topic', 'search'])))
            ->reorder()
            ->setEagerLoads([])
            ->select('quiz_category_id', 'topic', DB::raw('count(*) as total'))
            ->groupBy('quiz_category_id', 'topic')
            ->get();

        $categories = QuizCategory::query()
            ->whereIn('id', $rows->pluck('quiz_category_id')->filter()->unique())
            ->get(['id', 'name', 'title'])
            ->keyBy('id');

        $sets = $rows
            ->map(fn (Flashcard $row): array => [
                'category' => $row->quiz_category_id !== null && $categories->has($row->quiz_category_id)
                    ? $categories[$row->quiz_category_id]->only(['id', 'name', 'title'])
                    : null,
                'topic' => $row->topic,
                'count' => (int) $row->getAttribute('total'),
            ])
            ->sortBy(fn (array $set): string => ($set['category']['title'] ?? '~').'|'.($set['topic'] ?? ''))
            ->values();

        return response()->json(['data' => $sets]);
    }

    /**
     * @return Builder<Flashcard>
     */
    private function filteredQuery(Request $request): Builder
    {
        $query = Flashcard::query()
            ->where('is_active', true)
            ->with(['category', 'state', 'vehicleType'])
            ->orderBy('sort_order')
            ->orderBy('id');

        // Unlike Quiz (where state/vehicle_type/category are all required), a flashcard's scoping
        // FKs are nullable *by design* — a null value means "applies universally" (e.g. a road-sign
        // meaning that's federally standardized, not state-specific). Filtering by a specific
        // state/vehicle/category must still surface those universal cards alongside the exact
        // matches, or a state-scoped study session would silently miss content meant for everyone.
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

        if ($request->filled('topic')) {
            $query->where('topic', $request->string('topic')->toString());
        }

        // Narrows the study deck too, not just the browse grid — `study` builds its query from the
        // same filters, so searching "right of way" and hitting Start studying gives you a session
        // of exactly the cards you were looking at.
        if ($request->filled('search')) {
            LikeSearch::apply($query, $request->string('search')->toString(), ['front_text', 'back_text']);
        }

        return $query;
    }
}
