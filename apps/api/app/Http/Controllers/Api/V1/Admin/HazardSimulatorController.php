<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\HazardAttemptStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\UpdateHazardSimulatorRequest;
use App\Http\Resources\Api\V1\Admin\HazardSimulatorResource;
use App\Http\Resources\Api\V1\HazardSimulatorAttemptResource;
use App\Models\HazardSimulator;
use App\Models\State;
use App\Models\VehicleType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Admin management of hazard simulators. Gated only by the route's `['verified','admin']`
 * middleware — no per-action authorize() (house style). Simulators originate from the content
 * importer, so there is no `store`/`destroy` here: `is_active=false` retires one,
 * `content_locked=true` freezes its hazard layer against future crawls.
 */
class HazardSimulatorController extends Controller
{
    /**
     * List hazard simulators (admin)
     *
     * Active + inactive together (filter `active_only=1`), plus `locked_only=1`. Envelope shape
     * mirrors Admin\VideoController::index — the paginated list under `hazard_simulators`, with
     * lookup lists for the filter dropdowns alongside.
     */
    public function index(Request $request): JsonResponse
    {
        $query = HazardSimulator::query()
            ->select('hazard_simulators.*')
            ->join('videos', 'videos.id', '=', 'hazard_simulators.video_id')
            ->with(['video.state', 'video.vehicleType'])
            ->withCount(['hazards', 'attempts'])
            ->orderBy('videos.order_no')
            ->orderBy('videos.title');

        if ($request->filled('state_id')) {
            $query->where('videos.state_id', $request->integer('state_id'));
        }

        if ($request->filled('vehicle_type_id')) {
            $query->where('videos.vehicle_type_id', $request->integer('vehicle_type_id'));
        }

        if ($request->filled('test_level')) {
            $query->where('hazard_simulators.test_level', $request->string('test_level')->toString());
        }

        if ($request->boolean('active_only')) {
            $query->where('hazard_simulators.is_active', true);
        }

        if ($request->boolean('locked_only')) {
            $query->where('hazard_simulators.content_locked', true);
        }

        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        return response()->json([
            'hazard_simulators' => HazardSimulatorResource::collection($query->paginate($perPage)->withQueryString())
                ->response()->getData(true),
            'states' => State::query()->orderBy('name')->get(['id', 'code', 'name']),
            'vehicle_types' => VehicleType::query()->where('is_active', true)->orderBy('title')->get(['id', 'name', 'title']),
        ]);
    }

    /**
     * Show a hazard simulator (admin)
     *
     * The full simulator with its ordered hazards, plus a per-scored-hazard spot-rate report
     * (least-spotted first — the content-QA signal for a bad window or a mislabeled hazard), the
     * 10 most recent completed attempts, and the scoring-profile names available in config.
     */
    public function show(HazardSimulator $hazardSimulator): JsonResponse
    {
        $hazardSimulator->load(['video.state', 'video.vehicleType', 'hazards']);

        return response()->json([
            'hazard_simulator' => new HazardSimulatorResource($hazardSimulator),
            'hazard_stats' => $this->hazardSpotRates($hazardSimulator),
            'recent_attempts' => HazardSimulatorAttemptResource::collection(
                $hazardSimulator->attempts()
                    ->where('status', HazardAttemptStatus::Completed)
                    ->with('user')
                    ->latest('completed_at')
                    ->limit(10)
                    ->get(),
            ),
            'scoring_profiles' => array_keys((array) config('hazard.profiles')),
        ]);
    }

    /**
     * Update a hazard simulator (admin)
     *
     * Only the staff-editable fields — timing/location labels, pass threshold, scoring profile,
     * active flag, and the content lock. Title/thumbnail/premium live on the Video.
     */
    public function update(UpdateHazardSimulatorRequest $request, HazardSimulator $hazardSimulator): JsonResponse
    {
        $hazardSimulator->update($request->validated());

        return response()->json([
            'hazard_simulator' => new HazardSimulatorResource(
                $hazardSimulator->fresh()->load(['video.state', 'video.vehicleType']),
            ),
        ]);
    }

    /**
     * Miss/hit tally per scored hazard, for the least-spotted-hazards report. LEFT JOIN so a
     * hazard with no attempt data yet still shows (0/0). CASE WHEN keeps it portable across
     * sqlite (tests) and mysql.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function hazardSpotRates(HazardSimulator $simulator): Collection
    {
        return DB::table('hazards')
            ->leftJoin('hazard_simulator_attempt_events as e', function ($join): void {
                $join->on('e.hazard_id', '=', 'hazards.id')->whereIn('e.kind', ['hit', 'miss']);
            })
            ->where('hazards.hazard_simulator_id', $simulator->id)
            ->where('hazards.in_timeline', true)
            ->where('hazards.mode', 'assessment')
            ->groupBy('hazards.id', 'hazards.type', 'hazards.comment')
            ->selectRaw(
                'hazards.id as hazard_id, hazards.type as type, hazards.comment as comment, '.
                'SUM(CASE WHEN e.kind = ? THEN 1 ELSE 0 END) as hits, '.
                'SUM(CASE WHEN e.kind = ? THEN 1 ELSE 0 END) as misses, '.
                'COUNT(e.id) as total',
                ['hit', 'miss'],
            )
            ->get()
            ->map(fn ($row) => [
                'hazard_id' => (int) $row->hazard_id,
                'type' => $row->type,
                'comment' => $row->comment,
                'hits' => (int) $row->hits,
                'misses' => (int) $row->misses,
                'total' => (int) $row->total,
                'miss_rate' => (int) $row->total > 0 ? round((int) $row->misses / (int) $row->total * 100, 1) : 0.0,
            ])
            ->sortByDesc('miss_rate')
            ->values();
    }
}
