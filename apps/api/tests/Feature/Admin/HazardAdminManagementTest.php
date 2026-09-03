<?php

namespace Tests\Feature\Admin;

use App\Models\HazardSimulator;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HazardAdminManagementTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    /** A simulator with 1 demo + 3 scored assessment hazards (sort_order 0..3). */
    private function makeSimulator(): HazardSimulator
    {
        $video = Video::factory()->create(['section' => 'Defensive Driving Hazard Simulators']);
        $simulator = HazardSimulator::factory()->create(['video_id' => $video->id, 'slug' => 'sim-a']);

        $simulator->hazards()->createMany([
            ['source_hazard_id' => 10, 'type' => 'sign', 'mode' => 'demo', 'in_timeline' => true, 'sort_order' => 0, 'time_start' => 4, 'time_end' => 8, 'comment' => 'Demo'],
            ['source_hazard_id' => 11, 'type' => 'vehicle', 'mode' => 'assessment', 'in_timeline' => true, 'sort_order' => 1, 'time_start' => 20, 'time_end' => 26, 'comment' => 'H11'],
            ['source_hazard_id' => 12, 'type' => 'vehicle', 'mode' => 'assessment', 'in_timeline' => true, 'sort_order' => 2, 'time_start' => 40, 'time_end' => 46, 'comment' => 'H12'],
            ['source_hazard_id' => 13, 'type' => 'pedestrian', 'mode' => 'assessment', 'in_timeline' => true, 'sort_order' => 3, 'time_start' => 60, 'time_end' => 66, 'comment' => 'H13'],
        ]);
        $simulator->syncHazardCounts();

        return $simulator;
    }

    public function test_guest_and_non_admin_are_blocked(): void
    {
        $simulator = $this->makeSimulator();

        $this->getJson("/api/v1/admin/hazard-simulators/{$simulator->id}/hazards")->assertUnauthorized();
        $this->actingAs(User::factory()->create(['is_admin' => false]), 'sanctum')
            ->getJson("/api/v1/admin/hazard-simulators/{$simulator->id}/hazards")->assertForbidden();
    }

    public function test_index_lists_all_hazards_timeline_first(): void
    {
        $simulator = $this->makeSimulator();
        $simulator->hazards()->create([
            'source_hazard_id' => 99, 'type' => 'pedestrian', 'mode' => 'assessment',
            'in_timeline' => false, 'sort_order' => null, 'time_start' => 70, 'time_end' => 73, 'comment' => 'Pool',
        ]);

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->getJson("/api/v1/admin/hazard-simulators/{$simulator->id}/hazards");

        $response->assertOk();
        $ordered = collect($response->json('hazards'))->pluck('source_hazard_id')->all();
        $this->assertSame([10, 11, 12, 13, 99], $ordered); // pool-only (99) sorts last
    }

    public function test_store_appends_a_scored_hazard_and_bumps_the_counts(): void
    {
        $simulator = $this->makeSimulator();

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/v1/admin/hazard-simulators/{$simulator->id}/hazards", [
                'type' => 'signal', 'mode' => 'assessment', 'in_timeline' => true,
                'time_start' => 80, 'time_end' => 86, 'comment' => 'New signal',
            ]);

        $response->assertCreated();
        $response->assertJsonPath('hazard.sort_order', 4); // appended after 0..3
        $response->assertJsonPath('hazard.source_hazard_id', null);
        $this->assertSame(5, $simulator->fresh()->hazard_count);
    }

    public function test_store_a_demo_hazard_updates_demo_count(): void
    {
        $simulator = $this->makeSimulator();

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/v1/admin/hazard-simulators/{$simulator->id}/hazards", [
                'type' => 'sign', 'mode' => 'demo', 'in_timeline' => true,
                'time_start' => 10, 'time_end' => 14,
            ])->assertCreated();

        $this->assertSame(2, $simulator->fresh()->demo_hazard_count);
    }

    public function test_store_rejects_a_zero_length_window(): void
    {
        $simulator = $this->makeSimulator();

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/v1/admin/hazard-simulators/{$simulator->id}/hazards", [
                'type' => 'vehicle', 'mode' => 'assessment', 'in_timeline' => true,
                'time_start' => 30, 'time_end' => 30,
            ])->assertUnprocessable()->assertJsonValidationErrors(['time_end']);
    }

    public function test_a_hazard_from_another_simulator_is_not_found(): void
    {
        $a = $this->makeSimulator();
        $bVideo = Video::factory()->create();
        $b = HazardSimulator::factory()->create(['video_id' => $bVideo->id, 'slug' => 'sim-b']);
        $foreign = $b->hazards()->create(['type' => 'vehicle', 'mode' => 'assessment', 'in_timeline' => true, 'sort_order' => 0, 'time_start' => 1, 'time_end' => 5]);

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson("/api/v1/admin/hazard-simulators/{$a->id}/hazards/{$foreign->id}")
            ->assertNotFound();
    }

    public function test_update_toggling_in_timeline_recomputes_counts(): void
    {
        $simulator = $this->makeSimulator();
        $h13 = $simulator->hazards()->where('source_hazard_id', 13)->firstOrFail();

        // pull it out of the timeline
        $this->actingAs($this->admin(), 'sanctum')
            ->putJson("/api/v1/admin/hazard-simulators/{$simulator->id}/hazards/{$h13->id}", ['in_timeline' => false])
            ->assertOk()->assertJsonPath('hazard.sort_order', null);
        $this->assertSame(3, $simulator->fresh()->hazard_count);

        // put it back — appended at the end
        $this->actingAs($this->admin(), 'sanctum')
            ->putJson("/api/v1/admin/hazard-simulators/{$simulator->id}/hazards/{$h13->id}", ['in_timeline' => true])
            ->assertOk()->assertJsonPath('hazard.sort_order', 3);
        $this->assertSame(4, $simulator->fresh()->hazard_count);
    }

    public function test_move_swaps_neighbours_and_is_a_no_op_at_the_edge(): void
    {
        $simulator = $this->makeSimulator();
        $h12 = $simulator->hazards()->where('source_hazard_id', 12)->firstOrFail(); // sort_order 2

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/v1/admin/hazard-simulators/{$simulator->id}/hazards/{$h12->id}/move", ['direction' => 'up'])
            ->assertOk();

        $order = $simulator->hazards()->where('in_timeline', true)->orderBy('sort_order')->pluck('source_hazard_id')->all();
        $this->assertSame([10, 12, 11, 13], $order);

        // moving the first item up is a no-op (still 200)
        $h10 = $simulator->hazards()->where('source_hazard_id', 10)->firstOrFail()->fresh();
        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/v1/admin/hazard-simulators/{$simulator->id}/hazards/{$h10->id}/move", ['direction' => 'up'])
            ->assertOk();
        $this->assertSame([10, 12, 11, 13], $simulator->hazards()->where('in_timeline', true)->orderBy('sort_order')->pluck('source_hazard_id')->all());
    }

    public function test_reorder_renumbers_the_full_set_and_rejects_a_partial_one(): void
    {
        $simulator = $this->makeSimulator();
        $ids = $simulator->hazards()->where('in_timeline', true)->orderBy('sort_order')->pluck('id')->all();
        $reversed = array_reverse($ids);

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/v1/admin/hazard-simulators/{$simulator->id}/hazards/reorder", ['order' => $reversed])
            ->assertOk();
        $this->assertSame(
            [13, 12, 11, 10],
            $simulator->hazards()->where('in_timeline', true)->orderBy('sort_order')->pluck('source_hazard_id')->all(),
        );

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/v1/admin/hazard-simulators/{$simulator->id}/hazards/reorder", ['order' => [$ids[0], $ids[1]]])
            ->assertUnprocessable()->assertJsonValidationErrors(['order']);
    }

    public function test_destroy_renumbers_survivors_and_recomputes_counts(): void
    {
        $simulator = $this->makeSimulator();
        $h11 = $simulator->hazards()->where('source_hazard_id', 11)->firstOrFail(); // sort_order 1

        $this->actingAs($this->admin(), 'sanctum')
            ->deleteJson("/api/v1/admin/hazard-simulators/{$simulator->id}/hazards/{$h11->id}")
            ->assertOk();

        $this->assertDatabaseMissing('hazards', ['id' => $h11->id]);
        $this->assertSame(3, $simulator->fresh()->hazard_count);
        $this->assertSame(
            [0, 1, 2],
            $simulator->hazards()->where('in_timeline', true)->orderBy('sort_order')->pluck('sort_order')->all(),
        );
    }
}
