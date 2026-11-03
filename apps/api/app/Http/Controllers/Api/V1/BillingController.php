<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Billing\CreateCheckoutSession;
use App\Actions\Billing\SyncStripeSubscriptions;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreCheckoutRequest;
use App\Http\Resources\Api\V1\InvoiceResource;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Entitlement\EntitlementResolver;
use App\Support\PendingCheckout;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BillingController extends Controller
{
    public function __construct(
        private readonly CreateCheckoutSession $createCheckoutSession,
        private readonly EntitlementResolver $entitlement,
        private readonly SyncStripeSubscriptions $syncSubscriptions,
    ) {}

    /**
     * Start a Stripe Checkout session
     *
     * Requires authentication. `plan_key` must be an active, paid plan. Returns the Stripe-hosted
     * Checkout URL to redirect the browser to — recurring plans open a `subscription`-mode session,
     * the one-time Lifetime-Family plan opens a `payment`-mode session. Access is granted once
     * Stripe's webhook confirms the purchase, not by this response — the frontend should poll
     * `GET /billing/subscription` after redirect rather than assume access is live immediately.
     */
    public function checkout(StoreCheckoutRequest $request): JsonResponse
    {
        $plan = Plan::query()->with('vehicleType')->where('key', $request->string('plan_key'))->firstOrFail();

        $entitlement = $this->entitlement->resolve($request->user());
        $alreadyCovered = $plan->vehicle_type_id === null
            ? $entitlement->hasPaidAccess() && $entitlement->vehicleTypeIds === null
            : $entitlement->coversVehicle($plan->vehicle_type_id);

        if ($alreadyCovered) {
            return response()->json([
                'message' => __('You already have Premium for :vehicle.', ['vehicle' => $plan->vehicleType?->title ?? __('every vehicle')]),
            ], 422);
        }

        $url = ($this->createCheckoutSession)($request->user(), $plan);

        // The sign-up detour (if any) is over once checkout opens; don't resume it a second time.
        PendingCheckout::forget($request->user());

        return response()->json(['checkout_url' => $url]);
    }

    /**
     * My current subscription/entitlement
     *
     * Requires authentication. Thin wrapper around `EntitlementResolver` — the same source of
     * truth every policy check reads from, so this always agrees with the `entitlement` block on
     * `GET /me`. Also surfaces the raw Cashier subscription status when one exists, for a billing
     * settings page to render "renews on X" / "past due" copy.
     */
    public function subscription(Request $request): JsonResponse
    {
        $user = $request->user();

        // A customer with no subscription row is the shape a missed webhook leaves behind: checkout
        // created the Stripe customer, the charge went through, and nothing ever wrote the
        // subscription here. Ask Stripe directly before reporting them as free — this is the call
        // the post-checkout page polls, so the account repairs itself instead of needing a webhook
        // redelivery. Anyone who really has no subscription costs one API call.
        if ($user->subscriptions->isEmpty() && $user->stripe_id !== null && ($this->syncSubscriptions)($user) > 0) {
            $user->load('subscriptions');
        }

        $entitlement = $this->entitlement->resolve($user);
        $subscriptions = $this->currentSubscriptions($user);

        return response()->json([
            'tier' => $entitlement->tier,
            'status' => $entitlement->status,
            'access_until' => $entitlement->accessUntil,
            'family_group_id' => $entitlement->familyGroupId,
            'is_premium' => $entitlement->isPremium(),
            'premium_vehicle_types' => $this->entitlement->premiumVehicleTypeNames($entitlement),
            'subscription' => $subscriptions[0] ?? null,
            'subscriptions' => $subscriptions,
        ]);
    }

    private function currentSubscriptions(User $user): array
    {
        $subscriptions = $user->subscriptions->filter(fn (Subscription $subscription) => $subscription->valid() || $subscription->pastDue());

        $plans = Plan::query()
            ->with('vehicleType')
            ->whereIn('stripe_price_id', $subscriptions->pluck('stripe_price')->filter()->all())
            ->get()
            ->keyBy('stripe_price_id');

        return $subscriptions->map(function (Subscription $subscription) use ($plans): array {
            $plan = $plans->get($subscription->stripe_price);

            return [
                'id' => $subscription->id,
                'plan_name' => $plan?->name,
                'vehicle_type' => $plan?->vehicleType?->name,
                'stripe_status' => $subscription->stripe_status,
                'canceled' => $subscription->canceled(),
                'ends_at' => $subscription->ends_at,
                'on_trial' => $subscription->onTrial(),
                'trial_ends_at' => $subscription->trial_ends_at,
            ];
        })->values()->all();
    }

    /**
     * Cancel my subscription
     *
     * Requires authentication. Uses Cashier's `cancel()` (not `cancelNow()`) — access continues
     * until the current paid period ends, matching "cancel anytime, still works until it runs out."
     */
    public function cancelSubscription(Request $request): JsonResponse
    {
        $request->validate(['subscription_id' => ['nullable', 'integer']]);

        $cancellable = $request->user()->subscriptions
            ->filter(fn (Subscription $subscription) => $subscription->valid() && ! $subscription->canceled());

        $subscription = $request->filled('subscription_id')
            ? $cancellable->firstWhere('id', $request->integer('subscription_id'))
            : ($cancellable->count() === 1 ? $cancellable->first() : null);

        if ($subscription === null) {
            return response()->json([
                'message' => $cancellable->count() > 1 && ! $request->filled('subscription_id')
                    ? __('You have more than one subscription — choose which one to cancel.')
                    : __('You do not have an active subscription.'),
            ], 422);
        }

        $subscription->cancel();

        return response()->json(['message' => __('Your subscription has been canceled and will end at the close of your current billing period.')]);
    }

    /**
     * My invoices
     *
     * Requires authentication. Sourced live from Stripe, most recent first (Stripe's own default
     * ordering) — not cached locally.
     */
    public function invoices(Request $request): AnonymousResourceCollection
    {
        return InvoiceResource::collection($request->user()->invoices());
    }

    /**
     * Stripe Customer Portal link
     *
     * Requires authentication. Redirect the browser to the returned URL to let the customer
     * manage their payment method and download invoices directly through Stripe.
     */
    public function portal(Request $request): JsonResponse
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        return response()->json([
            'portal_url' => $request->user()->billingPortalUrl("{$frontendUrl}/settings/billing"),
        ]);
    }
}
