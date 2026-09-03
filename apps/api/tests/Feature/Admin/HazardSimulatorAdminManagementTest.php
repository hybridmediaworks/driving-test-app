<?php

namespace Tests\Feature\Admin;

use App\Models\HazardSimulator;
use App\Models\HazardSimulatorAttempt;
use App\Models\HazardSimulatorAttemptEvent;
use App\Models\State;
use App\Models\User;
use App\Models\VehicleType;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HazardSimulatorAdminManagementTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    private function makeSimulator(array $overrides = []): HazardSimulator
    {
        $video = Video::factory()->create([
            'section' => 'Defensive Driving Hazard Simulators',
            'is_premium' => true,
        ]);

        $simulator = HazardSimulator::factory()->create(array_merge([
            'video_id' => $video->id,
            'slug' => 'al-hazard-sim-1',
            'test_level' => 'Hard',
        ], $overrides));

        $simulator->hazards()->createMany([
            ['source_hazard_id' => 1, 'type' => 'sign', 'mode' => 'demo', 'in_timeline' => true, 'sort_order' => 0, 'time_start' => 4, 'time_end' => 8, 'comment' => 'Demo sign'],
            ['source_hazard_id' => 2, 'type' => 'vehicle', 'mode' => 'assessment', 'in_timeline' => true, 'sort_order' => 1, 'time_start' => 20, 'time_end' => 26, 'comment' => 'Braking car'],
            ['source_hazard_id' => 3, 'type' => 'pedestrian', 'mode' => 'assessment', 'in_timeline' => true, 'sort_order' => 2, 'time_start' => 40, 'time_end' => 46, 'comment' => 'Cyclist'],
        ]);

        return $simulator;
    }

    public function test_guest_and_non_admin_are_blocked(): void
    {
        $this->getJson('/api/v1/admin/hazard-simulators')->assertUnauthorized();

        $this->actingAs(User::factory()->create(['is_admin' => false]), 'sanctum')
            ->getJson('/api/v1/admin/hazard-simulators')->assertForbidden();
    }

    public function test_index_returns_the_envelope_with_lookup_lists_and_counts(): void
    {
        $california = State::factory()->create(['code' => 'CA']);
        $car = VehicleType::factory()->create(['name' => 'car']);
        $this->makeSimulator();
        $this->makeSimulator([
            'slug' => 'ca-locked',
            'content_locked' => true,
            'video_id' => Video::factory()->create(['state_id' => $california->id, 'vehicle_type_id' => $car->id])->id,
        ]);

        $response = $this->actingAs($this->admin(), 'sanctum')->getJson('/api/v1/admin/hazard-simulators');

        $response->assertOk();
        $response->assertJsonStructure(['hazard_simulators' => ['data', 'links', 'meta'], 'states', 'vehicle_types']);
        $this->assertCount(2, $response->json('hazard_simulators.data'));
        $first = $response->json('hazard_simulators.data.0');
        $this->assertSame(3, $first['hazards_count']);
        $this->assertArrayHasKey('attempts_count', $first);
    }

    public function test_index_filters_by_state_and_locked_only(): void
    {
        $california = State::factory()->create(['code' => 'CA']);
        $this->makeSimulator(); // no state, unlocked
        $this->makeSimulator([
            'slug' => 'ca-locked',
            'content_locked' => true,
            'video_id' => Video::factory()->create(['state_id' => $california->id])->id,
        ]);

        $admin = $this->admin();

        $locked = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/hazard-simulators?locked_only=1');
        $this->assertSame(['ca-locked'], collect($locked->json('hazard_simulators.data'))->pluck('slug')->all());

        $byState = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/admin/hazard-simulators?state_id={$california->id}");
        $this->assertSame(['ca-locked'], collect($byState->json('hazard_simulators.data'))->pluck('slug')->all());
    }

    public function test_show_returns_ordered_hazards_spot_rates_recent_attempts_and_scoring_profiles(): void
    {
        $simulator = $this->makeSimulator();
        $missed = $simulator->hazards()->where('source_hazard_id', 2)->firstOrFail();
        $spotted = $simulator->hazards()->where('source_hazard_id', 3)->firstOrFail();

        $attempt = HazardSimulatorAttempt::factory()->create(['hazard_simulator_id' => $simulator->id]);
        HazardSimulatorAttemptEvent::query()->create(['hazard_simulator_attempt_id' => $attempt->id, 'hazard_id' => $missed->id, 'kind' => 'miss']);
        HazardSimulatorAttemptEvent::query()->create(['hazard_simulator_attempt_id' => $attempt->id, 'hazard_id' => $missed->id, 'kind' => 'miss']);
        HazardSimulatorAttemptEvent::query()->create(['hazard_simulator_attempt_id' => $attempt->id, 'hazard_id' => $spotted->id, 'kind' => 'hit']);

        $response = $this->actingAs($this->admin(), 'sanctum')->getJson("/api/v1/admin/hazard-simulators/{$simulator->id}");

        $response->assertOk();
        $this->assertSame([1, 2, 3], collect($response->json('hazard_simulator.hazards'))->pluck('source_hazard_id')->all());
        $this->assertSame(['standard'], $response->json('scoring_profiles'));
        $this->assertIsArray($response->json('recent_attempts'));

        // hazard 2 (2 misses / 2 events) is the least spotted → first in the report.
        $stats = collect($response->json('hazard_stats'));
        $this->assertSame($missed->id, $stats->first()['hazard_id']);
        $this->assertEquals(100.0, $stats->first()['miss_rate']);
        $this->assertEquals(0.0, $stats->firstWhere('hazard_id', $spotted->id)['miss_rate']);
    }

    public function test_show_binds_by_id_not_slug(): void
    {
        $simulator = $this->makeSimulator(['slug' => 'not-a-number']);

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson("/api/v1/admin/hazard-simulators/{$simulator->id}")
            ->assertOk()
            ->assertJsonPath('hazard_simulator.slug', 'not-a-number');
    }

    public function test_admin_can_update_threshold_scoring_active_and_lock(): void
    {
        $simulator = $this->makeSimulator();

        $response = $this->actingAs($this->admin(), 'sanctum')->putJson("/api/v1/admin/hazard-simulators/{$simulator->id}", [
            'test_level' => 'Medium',
            'test_location' => 'Austin, TX',
            'test_number' => '4',
            'pass_threshold_percent' => 55,
            'scoring_profile' => 'standard',
            'is_active' => false,
            'content_locked' => true,
        ]);

        $response->assertOk();
        $response->assertJsonPath('hazard_simulator.pass_threshold_percent', 55);
        $response->assertJsonPath('hazard_simulator.content_locked', true);
        $this->assertDatabaseHas('hazard_simulators', [
            'id' => $simulator->id, 'pass_threshold_percent' => 55, 'is_active' => false, 'content_locked' => true, 'test_level' => 'Medium',
        ]);
    }

    public function test_update_rejects_an_unknown_scoring_profile(): void
    {
        $simulator = $this->makeSimulator();

        $this->actingAs($this->admin(), 'sanctum')->putJson("/api/v1/admin/hazard-simulators/{$simulator->id}", [
            'scoring_profile' => 'aggressive',
            'is_active' => true,
            'content_locked' => false,
        ])->assertUnprocessable()->assertJsonValidationErrors(['scoring_profile']);
    }

    public function test_hazard_simulators_have_no_admin_create_or_delete_route(): void
    {
        $simulator = $this->makeSimulator();
        $admin = $this->admin();

        $create = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/hazard-simulators', []);
        $this->assertContains($create->status(), [404, 405]);

        $delete = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/hazard-simulators/{$simulator->id}");
        $this->assertContains($delete->status(), [404, 405]);
    }
}
