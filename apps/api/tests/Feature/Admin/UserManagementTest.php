<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_list_users(): void
    {
        $response = $this->getJson('/api/v1/admin/users');

        $response->assertUnauthorized();
    }

    public function test_non_admin_cannot_list_users(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/admin/users');

        $response->assertForbidden();
    }

    public function test_admin_can_list_users_paginated(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        User::factory()->count(3)->create();

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/users');

        $response->assertOk();
        $response->assertJsonStructure(['data', 'links', 'meta']);
        $this->assertCount(4, $response->json('data'));
    }

    public function test_admin_can_search_users_by_name_or_email(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        User::factory()->create(['name' => 'Zara Khan', 'email' => 'zara@example.com']);
        User::factory()->create(['name' => 'Other Person', 'email' => 'other@example.com']);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/users?search=zara');

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name');
        $this->assertTrue($names->contains('Zara Khan'));
        $this->assertFalse($names->contains('Other Person'));
    }

    public function test_admin_can_filter_users_by_is_admin(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/users?is_admin=1');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_admin_can_create_a_user(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/users', [
            'name' => 'New Person',
            'email' => 'new-person@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'is_admin' => false,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('users', ['email' => 'new-person@example.com', 'is_admin' => false]);
        $created = User::query()->where('email', 'new-person@example.com')->firstOrFail();
        $this->assertNotNull($created->email_verified_at);
    }

    public function test_admin_can_update_another_users_name_and_email(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $target = User::factory()->create(['name' => 'Old Name', 'email' => 'old@example.com']);

        $response = $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/admin/users/{$target->id}", [
            'name' => 'New Name',
            'email' => 'new@example.com',
            'is_admin' => false,
        ]);

        $response->assertOk();
        $target->refresh();
        $this->assertSame('New Name', $target->name);
        $this->assertSame('new@example.com', $target->email);
        $this->assertNull($target->email_verified_at);
    }

    public function test_admin_cannot_revoke_their_own_admin_access(): void
    {
        $admin = User::factory()->create(['is_admin' => true, 'name' => 'Admin', 'email' => 'admin@example.com']);

        $response = $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/admin/users/{$admin->id}", [
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'is_admin' => false,
        ]);

        $response->assertStatus(422);
        $this->assertTrue($admin->fresh()->is_admin);
    }

    public function test_admin_cannot_delete_their_own_account(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/users/{$admin->id}");

        $response->assertStatus(422);
        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_admin_can_delete_another_admin(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $otherAdmin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/users/{$otherAdmin->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $otherAdmin->id]);
    }

    public function test_admin_can_delete_a_regular_user(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $target = User::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/users/{$target->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $target->id]);
    }
}
