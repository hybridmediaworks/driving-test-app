<?php

namespace Tests\Feature\Billing;

use App\Models\FamilyGroup;
use App\Models\FamilyMember;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SignsStripeWebhooks;
use Tests\TestCase;

class StripeWebhookTest extends TestCase
{
    use RefreshDatabase;
    use SignsStripeWebhooks;

    public function test_customer_subscription_created_syncs_a_local_subscription_row(): void
    {
        $user = User::factory()->create(['stripe_id' => 'cus_test_1']);

        $response = $this->postSignedStripeWebhook([
            'id' => 'evt_created_1',
            'type' => 'customer.subscription.created',
            'data' => ['object' => [
                'id' => 'sub_test_1',
                'customer' => 'cus_test_1',
                'status' => 'active',
                'items' => ['data' => [[
                    'id' => 'si_test_1',
                    'price' => ['id' => 'price_monthly_test', 'product' => 'prod_test_1'],
                    'quantity' => 1,
                ]]],
            ]],
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('subscriptions', [
            'user_id' => $user->id,
            'stripe_id' => 'sub_test_1',
            'stripe_status' => 'active',
            'stripe_price' => 'price_monthly_test',
        ]);
    }

    public function test_customer_subscription_updated_stamps_past_due_since_when_status_becomes_past_due(): void
    {
        $user = User::factory()->create(['stripe_id' => 'cus_test_2']);
        $subscription = Subscription::query()->create([
            'user_id' => $user->id,
            'type' => 'default',
            'stripe_id' => 'sub_test_2',
            'stripe_status' => 'active',
            'stripe_price' => 'price_monthly_test',
            'quantity' => 1,
        ]);

        $response = $this->postSignedStripeWebhook([
            'id' => 'evt_updated_1',
            'type' => 'customer.subscription.updated',
            'data' => ['object' => [
                'id' => 'sub_test_2',
                'customer' => 'cus_test_2',
                'status' => 'past_due',
                'items' => ['data' => [[
                    'id' => 'si_test_2',
                    'price' => ['id' => 'price_monthly_test', 'product' => 'prod_test_1'],
                    'quantity' => 1,
                ]]],
            ]],
        ]);

        $response->assertOk();
        $subscription->refresh();
        $this->assertSame('past_due', $subscription->stripe_status);
        $this->assertNotNull($subscription->past_due_since);
    }

    public function test_customer_subscription_updated_clears_past_due_since_on_recovery(): void
    {
        $user = User::factory()->create(['stripe_id' => 'cus_test_3']);
        $subscription = Subscription::query()->create([
            'user_id' => $user->id,
            'type' => 'default',
            'stripe_id' => 'sub_test_3',
            'stripe_status' => 'past_due',
            'stripe_price' => 'price_monthly_test',
            'quantity' => 1,
            'past_due_since' => now()->subDay(),
        ]);

        $response = $this->postSignedStripeWebhook([
            'id' => 'evt_updated_2',
            'type' => 'customer.subscription.updated',
            'data' => ['object' => [
                'id' => 'sub_test_3',
                'customer' => 'cus_test_3',
                'status' => 'active',
                'items' => ['data' => [[
                    'id' => 'si_test_3',
                    'price' => ['id' => 'price_monthly_test', 'product' => 'prod_test_1'],
                    'quantity' => 1,
                ]]],
            ]],
        ]);

        $response->assertOk();
        $subscription->refresh();
        $this->assertSame('active', $subscription->stripe_status);
        $this->assertNull($subscription->past_due_since);
    }

    public function test_checkout_session_completed_for_one_time_payment_creates_family_group(): void
    {
        $user = User::factory()->create(['stripe_id' => 'cus_test_4']);
        $plan = Plan::factory()->create(['key' => 'lifetime_family', 'max_seats' => 3]);

        $response = $this->postSignedStripeWebhook([
            'id' => 'evt_checkout_1',
            'type' => 'checkout.session.completed',
            'data' => ['object' => [
                'id' => 'cs_test_1',
                'mode' => 'payment',
                'customer' => 'cus_test_4',
                'payment_intent' => 'pi_test_1',
                'metadata' => ['plan_id' => (string) $plan->id],
            ]],
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('family_groups', [
            'owner_user_id' => $user->id,
            'plan_id' => $plan->id,
            'stripe_payment_intent_id' => 'pi_test_1',
            'max_seats' => 3,
            'status' => 'active',
        ]);
        $group = FamilyGroup::query()->where('stripe_payment_intent_id', 'pi_test_1')->firstOrFail();
        $this->assertDatabaseHas('family_members', [
            'family_group_id' => $group->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'invite_status' => 'claimed',
        ]);
    }

    public function test_checkout_session_completed_for_subscription_mode_does_not_create_a_family_group(): void
    {
        $user = User::factory()->create(['stripe_id' => 'cus_test_5']);
        $plan = Plan::factory()->create(['key' => 'monthly']);

        $response = $this->postSignedStripeWebhook([
            'id' => 'evt_checkout_2',
            'type' => 'checkout.session.completed',
            'data' => ['object' => [
                'id' => 'cs_test_2',
                'mode' => 'subscription',
                'customer' => 'cus_test_5',
                'payment_intent' => null,
                'metadata' => ['plan_id' => (string) $plan->id],
            ]],
        ]);

        $response->assertOk();
        $this->assertDatabaseCount('family_groups', 0);
    }

    public function test_duplicate_event_id_is_not_processed_twice(): void
    {
        $user = User::factory()->create(['stripe_id' => 'cus_test_6']);
        $plan = Plan::factory()->create(['key' => 'lifetime_family', 'max_seats' => 3]);

        $payload = [
            'id' => 'evt_duplicate_1',
            'type' => 'checkout.session.completed',
            'data' => ['object' => [
                'id' => 'cs_test_3',
                'mode' => 'payment',
                'customer' => 'cus_test_6',
                'payment_intent' => 'pi_test_3',
                'metadata' => ['plan_id' => (string) $plan->id],
            ]],
        ];

        $first = $this->postSignedStripeWebhook($payload);
        $second = $this->postSignedStripeWebhook($payload);

        $first->assertOk();
        $second->assertOk();
        $this->assertDatabaseCount('family_groups', 1);
    }

    public function test_invalid_signature_is_rejected(): void
    {
        config(['cashier.webhook.secret' => 'whsec_real_secret']);

        $response = $this->postJson('/api/v1/stripe/webhook', [
            'id' => 'evt_bad_sig',
            'type' => 'customer.subscription.created',
            'data' => ['object' => []],
        ], [
            'Stripe-Signature' => 't='.time().',v1=not_a_real_signature',
        ]);

        $response->assertForbidden();
    }
}
