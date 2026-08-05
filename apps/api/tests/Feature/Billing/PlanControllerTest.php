<?php

namespace Tests\Feature\Billing;

use App\Models\Plan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlanControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_only_active_plans_ordered_by_sort_order(): void
    {
        Plan::factory()->create(['key' => 'b', 'is_active' => true, 'sort_order' => 2]);
        Plan::factory()->create(['key' => 'a', 'is_active' => true, 'sort_order' => 1]);
        Plan::factory()->create(['key' => 'hidden', 'is_active' => false, 'sort_order' => 0]);

        $response = $this->getJson('/api/v1/plans');

        $response->assertOk();
        $keys = collect($response->json('data'))->pluck('key');
        $this->assertSame(['a', 'b'], $keys->all());
    }

    public function test_plan_response_never_leaks_the_stripe_price_id(): void
    {
        Plan::factory()->create(['key' => 'monthly', 'stripe_price_id' => 'price_secret_123', 'is_active' => true]);

        $response = $this->getJson('/api/v1/plans');

        $response->assertOk();
        foreach ($response->json('data') as $plan) {
            $this->assertArrayNotHasKey('stripe_price_id', $plan);
        }
    }
}
