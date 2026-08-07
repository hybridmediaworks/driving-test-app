<?php

namespace Tests\Feature\Admin;

use App\Models\Quiz;
use App\Models\State;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StateManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_list_states_via_admin_endpoint(): void
    {
        $response = $this->getJson('/api/v1/admin/states');

        $response->assertUnauthorized();
    }

    public function test_non_admin_cannot_list_states_via_admin_endpoint(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/admin/states');

        $response->assertForbidden();
    }

    public function test_admin_can_list_states_paginated(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        State::factory()->count(3)->create();

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/states');

        $response->assertOk();
        $response->assertJsonStructure(['data', 'links', 'meta']);
        $this->assertCount(3, $response->json('data'));
    }

    public function test_admin_can_create_a_state(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/states', [
            'code' => 'ZZ',
            'name' => 'Zzyzx',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('states', ['code' => 'ZZ', 'name' => 'Zzyzx']);
    }

    public function test_admin_cannot_create_a_state_with_duplicate_code(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        State::factory()->create(['code' => 'CA']);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/states', [
            'code' => 'CA',
            'name' => 'Duplicate',
        ]);

        $response->assertStatus(422);
    }

    public function test_admin_can_update_a_state(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $state = State::factory()->create(['code' => 'OR', 'name' => 'Oregon']);

        $response = $this->actingAs($admin, 'sanctum')->putJson("/api/v1/admin/states/{$state->id}", [
            'code' => 'OR',
            'name' => 'Oregon (Updated)',
        ]);

        $response->assertOk();
        $this->assertSame('Oregon (Updated)', $state->fresh()->name);
    }

    public function test_admin_can_delete_an_unreferenced_state(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $state = State::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/states/{$state->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('states', ['id' => $state->id]);
    }

    public function test_admin_cannot_delete_a_state_with_quizzes(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $state = State::factory()->create();
        Quiz::factory()->create(['state_id' => $state->id]);

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/states/{$state->id}");

        $response->assertStatus(422);
        $this->assertDatabaseHas('states', ['id' => $state->id]);
    }
}
