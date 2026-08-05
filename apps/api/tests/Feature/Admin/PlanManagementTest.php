<?php

namespace Tests\Feature\Admin;

use App\Models\FamilyGroup;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlanManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_list_plans_via_admin_endpoint(): void
    {
        $response = $this->getJson('/api/v1/admin/plans');

        $response->assertUnauthorized();
    }

    public function test_non_admin_cannot_list_plans_via_admin_endpoint(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/admin/plans');

        $response->assertForbidden();
    }

    public function test_admin_can_list_plans_including_inactive_ones_with_stripe_ids(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Plan::factory()->create(['is_active' => false, 'stripe_price_id' => 'price_123']);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/plans');

        $response->assertOk();
        $response->assertJsonStructure(['data', 'links', 'meta']);
        $this->assertArrayHasKey('stripe_price_id', $response->json('data.0'));
    }

    public function test_admin_can_create_a_plan(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/plans', [
            'key' => 'annual',
            'name' => 'Annual',
            'type' => 'recurring',
            'billing_interval' => 'month',
            'price_cents' => 9900,
            'max_seats' => 1,
            'is_active' => true,
            'sort_order' => 4,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('plans', ['key' => 'annual', 'name' => 'Annual']);
        $this->assertNull(Plan::query()->where('key', 'annual')->firstOrFail()->stripe_price_id);
    }

    public function test_creating_a_plan_ignores_client_supplied_stripe_ids(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/plans', [
            'key' => 'annual',
            'name' => 'Annual',
            'type' => 'recurring',
            'billing_interval' => 'month',
            'price_cents' => 9900,
            'max_seats' => 1,
            'is_active' => true,
            'sort_order' => 4,
            'stripe_price_id' => 'price_hand_entered',
            'stripe_product_id' => 'prod_hand_entered',
        ]);

        $response->assertCreated();
        $this->assertNull(Plan::query()->where('key', 'annual')->firstOrFail()->stripe_price_id);
    }

    public function test_admin_can_update_a_plan(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $plan = Plan::factory()->create(['key' => 'old_key', 'name' => 'Old Name', 'price_cents' => 5000]);

        $response = $this->actingAs($admin, 'sanctum')->putJson("/api/v1/admin/plans/{$plan->id}", [
            'key' => $plan->key,
            'name' => 'New Name',
            'type' => $plan->type->value,
            'billing_interval' => $plan->billing_interval?->value,
            'price_cents' => 6000,
            'max_seats' => $plan->max_seats,
            'is_active' => $plan->is_active,
            'sort_order' => $plan->sort_order,
        ]);

        $response->assertOk();
        $plan->refresh();
        $this->assertSame('New Name', $plan->name);
        $this->assertSame(6000, $plan->price_cents);
    }

    public function test_admin_can_delete_a_plan_never_synced_to_stripe(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $plan = Plan::factory()->create(['stripe_price_id' => null]);

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/plans/{$plan->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('plans', ['id' => $plan->id]);
    }

    public function test_admin_cannot_delete_a_plan_synced_to_stripe(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $plan = Plan::factory()->create(['stripe_price_id' => 'price_123']);

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/plans/{$plan->id}");

        $response->assertStatus(422);
        $this->assertDatabaseHas('plans', ['id' => $plan->id]);
    }

    public function test_admin_cannot_delete_a_plan_with_family_groups(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $owner = User::factory()->create();
        $plan = Plan::factory()->create(['stripe_price_id' => null]);
        FamilyGroup::query()->create([
            'owner_user_id' => $owner->id,
            'plan_id' => $plan->id,
            'max_seats' => 3,
            'status' => 'active',
            'purchased_at' => now(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/plans/{$plan->id}");

        $response->assertStatus(422);
        $this->assertDatabaseHas('plans', ['id' => $plan->id]);
    }
}
