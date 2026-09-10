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

    public function test_admin_can_publish_the_permit_test_facts_for_a_state(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $state = State::factory()->create(['code' => 'WV', 'name' => 'West Virginia']);

        $response = $this->actingAs($admin, 'sanctum')->putJson("/api/v1/admin/states/{$state->id}", [
            'code' => 'WV',
            'name' => 'West Virginia',
            'agency_name' => 'DMV',
            'dmv_website_url' => 'https://transportation.wv.gov/DMV',
            'permit_test_fee_cents' => 1500,
            'retake_wait_days' => 7,
            'supervised_driving_hours' => 40,
            'minimum_permit_age' => 15,
            'test_language_count' => 2,
            'online_testing_available' => true,
        ]);

        $response->assertOk();
        $response->assertJsonPath('state.permit_test_fee_cents', 1500);
        $response->assertJsonPath('state.retake_wait_days', 7);
        $response->assertJsonPath('state.supervised_driving_hours', 40);
        $response->assertJsonPath('state.minimum_permit_age', 15);
        $response->assertJsonPath('state.test_language_count', 2);
        $response->assertJsonPath('state.online_testing_available', true);
    }

    public function test_permit_test_facts_are_optional_and_come_back_null_when_unpublished(): void
    {
        $state = State::factory()->create(['code' => 'WV', 'name' => 'West Virginia']);

        $response = $this->getJson('/api/v1/states');

        $response->assertOk();
        $response->assertJsonPath('data.0.permit_test_fee_cents', null);
        $response->assertJsonPath('data.0.minimum_permit_age', null);
        // Null, not false — "not published for this state" is distinct from "no online testing".
        $response->assertJsonPath('data.0.online_testing_available', null);
        $this->assertSame($state->code, $response->json('data.0.code'));
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
