<?php

namespace Tests\Feature\Admin;

use App\Models\Quiz;
use App\Models\User;
use App\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VehicleTypeManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_list_vehicle_types_via_admin_endpoint(): void
    {
        $response = $this->getJson('/api/v1/admin/vehicle-types');

        $response->assertUnauthorized();
    }

    public function test_non_admin_cannot_list_vehicle_types_via_admin_endpoint(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/admin/vehicle-types');

        $response->assertForbidden();
    }

    public function test_admin_can_list_vehicle_types_paginated(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        VehicleType::factory()->count(3)->create();

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/vehicle-types');

        $response->assertOk();
        $response->assertJsonStructure(['data', 'links', 'meta']);
        $this->assertCount(3, $response->json('data'));
    }

    public function test_admin_can_create_a_vehicle_type(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/vehicle-types', [
            'name' => 'moped',
            'title' => 'Moped',
            'is_active' => true,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('vehicle_types', ['name' => 'moped', 'title' => 'Moped']);
    }

    public function test_admin_can_update_a_vehicle_type(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $vehicleType = VehicleType::factory()->create(['name' => 'car', 'title' => 'Car']);

        $response = $this->actingAs($admin, 'sanctum')->putJson("/api/v1/admin/vehicle-types/{$vehicleType->id}", [
            'name' => 'car',
            'title' => 'Passenger Car',
            'is_active' => false,
        ]);

        $response->assertOk();
        $vehicleType->refresh();
        $this->assertSame('Passenger Car', $vehicleType->title);
        $this->assertFalse($vehicleType->is_active);
    }

    public function test_admin_can_delete_an_unreferenced_vehicle_type(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $vehicleType = VehicleType::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/vehicle-types/{$vehicleType->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('vehicle_types', ['id' => $vehicleType->id]);
    }

    public function test_admin_cannot_delete_a_vehicle_type_with_quizzes(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $vehicleType = VehicleType::factory()->create();
        Quiz::factory()->create(['vehicle_type_id' => $vehicleType->id]);

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/vehicle-types/{$vehicleType->id}");

        $response->assertStatus(422);
        $this->assertDatabaseHas('vehicle_types', ['id' => $vehicleType->id]);
    }
}
