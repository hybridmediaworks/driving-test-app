<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\FamilyGroup;
use App\Models\FamilyMember;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Laravel\Cashier\Http\Controllers\WebhookController as CashierWebhookController;
use Symfony\Component\HttpFoundation\Response;

class StripeWebhookController extends CashierWebhookController
{
    /**
     * Guards every Stripe webhook delivery against reprocessing before handing off to Cashier's
     * own dispatch logic — Stripe delivers at-least-once, not exactly-once, and several of our own
     * handlers below have side effects (creating a family group, stamping a grace-period date)
     * that must not run twice for the same event.
     */
    public function handleWebhook(Request $request): Response
    {
        $payload = json_decode($request->getContent(), true);
        $eventId = $payload['id'] ?? null;

        if ($eventId !== null) {
            $inserted = DB::table('processed_stripe_events')->insertOrIgnore([
                'stripe_event_id' => $eventId,
                'processed_at' => now(),
            ]);

            if ($inserted === 0) {
                return new Response('Webhook Already Processed', 200);
            }
        }

        return parent::handleWebhook($request);
    }

    /**
     * Cashier's own sync (called via parent::) has no knowledge of our app-owned `past_due_since`
     * column — this stamps it the moment Stripe reports `past_due` and clears it the moment the
     * subscription recovers, which is what EntitlementResolver's grace-period window reads from.
     */
    protected function handleCustomerSubscriptionUpdated(array $payload)
    {
        $response = parent::handleCustomerSubscriptionUpdated($payload);

        $data = $payload['data']['object'];
        $subscription = Subscription::query()->where('stripe_id', $data['id'])->first();

        if ($subscription !== null) {
            $subscription->past_due_since = $data['status'] === 'past_due'
                ? ($subscription->past_due_since ?? now())
                : null;
            $subscription->save();
        }

        return $response;
    }

    /**
     * Cashier has no built-in handler for this event — it only auto-syncs recurring subscriptions
     * via `customer.subscription.created`. The one-time Lifetime-Family purchase has no other
     * webhook to hook into, so this is where that purchase turns into real `family_groups` /
     * `family_members` rows.
     */
    protected function handleCheckoutSessionCompleted(array $payload)
    {
        $data = $payload['data']['object'];

        if (($data['mode'] ?? null) !== 'payment') {
            return $this->successMethod();
        }

        $planId = $data['metadata']['plan_id'] ?? null;

        /** @var User|null $user */
        $user = $this->getUserByStripeId($data['customer']);

        if ($planId === null || $user === null) {
            return $this->successMethod();
        }

        $plan = Plan::query()->find($planId);

        if ($plan === null) {
            return $this->successMethod();
        }

        // Unique index on stripe_payment_intent_id makes this safe against duplicate delivery
        // even if the top-level processed_stripe_events guard were ever bypassed.
        if (FamilyGroup::query()->where('stripe_payment_intent_id', $data['payment_intent'])->exists()) {
            return $this->successMethod();
        }

        DB::transaction(function () use ($plan, $user, $data): void {
            $group = FamilyGroup::query()->create([
                'owner_user_id' => $user->id,
                'plan_id' => $plan->id,
                'stripe_payment_intent_id' => $data['payment_intent'],
                'max_seats' => $plan->max_seats,
                'status' => 'active',
                'purchased_at' => now(),
            ]);

            FamilyMember::query()->create([
                'family_group_id' => $group->id,
                'user_id' => $user->id,
                'role' => 'owner',
                'invite_status' => 'claimed',
                'claimed_at' => now(),
            ]);
        });

        return $this->successMethod();
    }
}
