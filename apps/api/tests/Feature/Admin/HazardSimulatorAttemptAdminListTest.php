<?php

namespace Tests\Feature\Admin;

use App\Models\HazardSimulator;
use App\Models\HazardSimulatorAttempt;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HazardSimulatorAttemptAdminListTest extends TestCase
{
    use RefreshDatabase;

    private function simulator(string $slug): HazardSimulator
    {
        return HazardSimulator::factory()->create([
            'video_id' => Video::factory()->create()->id,
            'slug' => $slug,
        ]);
    }

    public function test_guest_and_non_admin_are_blocked(): void
    {
        $this->getJson('/api/v1/admin/hazard-simulator-attempts')->assertUnauthorized();
        $this->actingAs(User::factory()->create(['is_admin' => false]), 'sanctum')
            ->getJson('/api/v1/admin/hazard-simulator-attempts')->assertForbidden();
    }

    public function test_admin_sees_attempts_from_all_users_including_guests(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $sim = $this->simulator('sim-1');

        $mine = HazardSimulatorAttempt::factory()->create(['hazard_simulator_id' => $sim->id, 'user_id' => User::factory()->create()->id]);
        $guest = HazardSimulatorAttempt::factory()->guest('guest-xyz')->create(['hazard_simulator_id' => $sim->id]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/hazard-simulator-attempts');

        $response->assertOk();
        $this->assertEqualsCanonicalizing(
            [$mine->id, $guest->id],
            collect($response->json('data'))->pluck('id')->all(),
        );
    }

    public function test_filters_by_simulator_and_status(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $simA = $this->simulator('sim-a');
        $simB = $this->simulator('sim-b');

        $completedA = HazardSimulatorAttempt::factory()->create(['hazard_simulator_id' => $simA->id]);
        HazardSimulatorAttempt::factory()->inProgress()->create(['hazard_simulator_id' => $simA->id]);
        HazardSimulatorAttempt::factory()->create(['hazard_simulator_id' => $simB->id]);

        $bySim = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/admin/hazard-simulator-attempts?hazard_simulator_id={$simA->id}&status=completed");

        $bySim->assertOk();
        $this->assertSame([$completedA->id], collect($bySim->json('data'))->pluck('id')->all());
    }
}
