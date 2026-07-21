<?php

namespace Tests\Feature\Billing;

use App\Actions\Billing\CreateCheckoutSession;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BillingControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_requires_authentication(): void
    {
        Plan::factory()->create(['key' => 'monthly', 'price_cents' => 7500]);

        $response = $this->postJson('/api/v1/billing/checkout', ['plan_key' => 'monthly']);

        $response->assertUnauthorized();
    }

    public function test_checkout_rejects_an_unknown_plan_key(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/billing/checkout', ['plan_key' => 'does-not-exist']);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['plan_key']);
    }

    public function test_checkout_rejects_the_free_plan(): void
    {
        Plan::factory()->create(['key' => 'free', 'price_cents' => 0]);
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/billing/checkout', ['plan_key' => 'free']);

        $response->assertUnprocessable();
    }

    public function test_checkout_returns_the_url_from_the_checkout_action(): void
    {
        Plan::factory()->create(['key' => 'monthly', 'price_cents' => 7500]);
        $user = User::factory()->create();

        // CreateCheckoutSession genuinely calls Stripe's API — swap in a fake so this test proves
        // the controller's plumbing (auth, validation, response shape) without a network call.
        $this->app->instance(CreateCheckoutSession::class, new class extends CreateCheckoutSession
        {
            public function __invoke(User $user, Plan $plan): string
            {
                return 'https://checkout.stripe.com/fake-session';
            }
        });

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/billing/checkout', ['plan_key' => 'monthly']);

        $response->assertOk();
        $response->assertJson(['checkout_url' => 'https://checkout.stripe.com/fake-session']);
    }

    public function test_subscription_reflects_free_tier_for_a_user_with_no_subscription(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/billing/subscription');

        $response->assertOk();
        $response->assertJson(['tier' => 'free', 'is_premium' => false, 'subscription' => null]);
    }

    public function test_subscription_reflects_an_active_paid_subscription(): void
    {
        Plan::factory()->create(['key' => 'monthly', 'stripe_price_id' => 'price_sub_test']);
        $user = User::factory()->create();
        Subscription::query()->create([
            'user_id' => $user->id,
            'type' => 'default',
            'stripe_id' => 'sub_active_1',
            'stripe_status' => 'active',
            'stripe_price' => 'price_sub_test',
            'quantity' => 1,
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/billing/subscription');

        $response->assertOk();
        $response->assertJson(['tier' => 'monthly_subscriber', 'is_premium' => true]);
        $response->assertJsonPath('subscription.stripe_status', 'active');
    }

    public function test_cancel_subscription_returns_422_when_none_exists(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/billing/subscription/cancel');

        $response->assertUnprocessable();
    }

    // Note: the happy path of an actual cancellation calls Cashier's Subscription::cancel(),
    // which updates the subscription on Stripe directly (no interceptable seam in this
    // single-line controller method) — verified manually against the real Stripe test account,
    // same treatment as portal() below.

    public function test_invoices_returns_an_empty_list_for_a_user_with_no_stripe_customer(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/billing/invoices');

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }

    public function test_portal_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/billing/portal');

        $response->assertUnauthorized();
    }
}
