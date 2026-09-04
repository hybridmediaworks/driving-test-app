<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\MoveHazardRequest;
use App\Http\Requests\Api\V1\Admin\ReorderHazardsRequest;
use App\Http\Requests\Api\V1\Admin\StoreHazardRequest;
use App\Http\Requests\Api\V1\Admin\UpdateHazardRequest;
use App\Http\Resources\Api\V1\Admin\HazardResource;
use App\Http\Resources\Api\V1\Admin\HazardSimulatorResource;
use App\Models\Hazard;
use App\Models\HazardSimulator;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Admin CRUD + ordering for the hazards of one simulator. Mirrors Admin\QuizQuestionController.
 * Every hazard write recomputes the simulator's cached `hazard_count` / `demo_hazard_count` via
 * HazardSimulator::syncHazardCounts so the rollups the player reads never drift.
 */
class HazardController extends Controller
{
    /**
     * List a simulator's hazards (admin)
     *
     * Unpaginated — a simulator has at most a couple dozen hazards, and the editor needs the whole
     * ordered set to compute reorder positions. Ordered timeline-first (see HazardSimulator::hazards).
     */
    public function index(HazardSimulator $hazardSimulator): JsonResponse
    {
        return response()->json([
            'hazard_simulator' => new HazardSimulatorResource($hazardSimulator->load(['video'])),
            'hazards' => HazardResource::collection($hazardSimulator->hazards()->get()),
        ]);
    }

    /**
     * Add a hazard (admin)
     *
     * Staff-created hazards carry `source_hazard_id = null`, so the content importer never touches
     * or deletes them. A scored hazard is appended to the end of the timeline.
     */
    public function store(StoreHazardRequest $request, HazardSimulator $hazardSimulator): JsonResponse
    {
        $data = $request->validated();
        $data['source_hazard_id'] = null;
        $data['sort_order'] = ($data['in_timeline'] ?? false)
            ? $hazardSimulator->hazards()->where('in_timeline', true)->count()
            : null;

        $hazard = $hazardSimulator->hazards()->create($data);
        $hazardSimulator->syncHazardCounts();

        return response()->json(['hazard' => new HazardResource($hazard)], 201);
    }

    /**
     * Show a hazard (admin)
     */
    public function show(HazardSimulator $hazardSimulator, Hazard $hazard): JsonResponse
    {
        $this->assertBelongs($hazardSimulator, $hazard);

        return response()->json(['hazard' => new HazardResource($hazard)]);
    }

    /**
     * Update a hazard (admin)
     *
     * Toggling `in_timeline` on appends it to the timeline; toggling it off drops its position.
     */
    public function update(UpdateHazardRequest $request, HazardSimulator $hazardSimulator, Hazard $hazard): JsonResponse
    {
        $this->assertBelongs($hazardSimulator, $hazard);

        $data = $request->validated();

        if (array_key_exists('in_timeline', $data)) {
            if ($data['in_timeline'] && ! $hazard->in_timeline) {
                $data['sort_order'] = $hazardSimulator->hazards()->where('in_timeline', true)->count();
            } elseif (! $data['in_timeline']) {
                $data['sort_order'] = null;
            }
        }

        $hazard->update($data);
        $hazardSimulator->syncHazardCounts();

        return response()->json(['hazard' => new HazardResource($hazard->fresh())]);
    }

    /**
     * Delete a hazard (admin)
     *
     * Survivors' timeline positions are renumbered 0..n. Past attempt-event rows keep their
     * history (the FK nulls rather than cascades).
     */
    public function destroy(HazardSimulator $hazardSimulator, Hazard $hazard): JsonResponse
    {
        $this->assertBelongs($hazardSimulator, $hazard);

        DB::transaction(function () use ($hazardSimulator, $hazard): void {
            $hazard->delete();
            $this->renumberTimeline($hazardSimulator);
        });
        $hazardSimulator->syncHazardCounts();

        return response()->json(['message' => __('Hazard deleted.')]);
    }

    /**
     * Move one scored hazard up or down a position (admin)
     */
    public function move(MoveHazardRequest $request, HazardSimulator $hazardSimulator, Hazard $hazard): JsonResponse
    {
        $this->assertBelongs($hazardSimulator, $hazard);

        if (! $hazard->in_timeline) {
            abort(422, 'Only scored hazards can be reordered.');
        }

        $orderedIds = $hazardSimulator->hazards()
            ->where('in_timeline', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->pluck('id')
            ->all();

        $idx = array_search($hazard->id, $orderedIds, true);
        if ($idx === false) {
            abort(404);
        }

        $swapIdx = $request->validated('direction') === 'up' ? $idx - 1 : $idx + 1;
        if ($swapIdx < 0 || $swapIdx >= count($orderedIds)) {
            return response()->json(['message' => __('Hazard order updated.')]);
        }

        $newOrder = $orderedIds;
        [$newOrder[$idx], $newOrder[$swapIdx]] = [$newOrder[$swapIdx], $newOrder[$idx]];

        $this->persistOrder($hazardSimulator, $newOrder);

        return response()->json(['message' => __('Hazard order updated.')]);
    }

    /**
     * Reorder all scored hazards (admin)
     *
     * `order` is the full list of in-timeline hazard ids in their new sequence.
     */
    public function reorder(ReorderHazardsRequest $request, HazardSimulator $hazardSimulator): JsonResponse
    {
        $this->persistOrder($hazardSimulator, $request->validated('order'));

        return response()->json(['message' => __('Hazard order updated.')]);
    }

    private function assertBelongs(HazardSimulator $hazardSimulator, Hazard $hazard): void
    {
        if ($hazard->hazard_simulator_id !== $hazardSimulator->id) {
            abort(404);
        }
    }

    /**
     * @param  list<int>  $orderedIds
     */
    private function persistOrder(HazardSimulator $hazardSimulator, array $orderedIds): void
    {
        DB::transaction(function () use ($hazardSimulator, $orderedIds): void {
            foreach ($orderedIds as $index => $id) {
                Hazard::query()
                    ->where('hazard_simulator_id', $hazardSimulator->id)
                    ->whereKey($id)
                    ->update(['sort_order' => $index]);
            }
        });
    }

    private function renumberTimeline(HazardSimulator $hazardSimulator): void
    {
        $ids = $hazardSimulator->hazards()
            ->where('in_timeline', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->pluck('id')
            ->all();

        $this->persistOrder($hazardSimulator, $ids);
    }
}
