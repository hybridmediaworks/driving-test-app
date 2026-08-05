<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Billing\CreateCheckoutSession;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreCheckoutRequest;
use App\Http\Resources\Api\V1\InvoiceResource;
use App\Models\Plan;
use App\Services\Entitlement\EntitlementResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BillingController extends Controller
{
    public function __construct(
        private readonly CreateCheckoutSession $createCheckoutSession,
        private readonly EntitlementResolver $entitlement,
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
        $plan = Plan::query()->where('key', $request->string('plan_key'))->firstOrFail();

        $url = ($this->createCheckoutSession)($request->user(), $plan);

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
        $entitlement = $this->entitlement->resolve($user);
        $subscription = $user->subscription('default');

        return response()->json([
            'tier' => $entitlement->tier,
            'status' => $entitlement->status,
            'access_until' => $entitlement->accessUntil,
            'family_group_id' => $entitlement->familyGroupId,
            'is_premium' => $entitlement->isPremium(),
            'subscription' => $subscription === null ? null : [
                'stripe_status' => $subscription->stripe_status,
                'canceled' => $subscription->canceled(),
                'ends_at' => $subscription->ends_at,
            ],
        ]);
    }

    /**
     * Cancel my subscription
     *
     * Requires authentication. Uses Cashier's `cancel()` (not `cancelNow()`) — access continues
     * until the current paid period ends, matching "cancel anytime, still works until it runs out."
     */
    public function cancelSubscription(Request $request): JsonResponse
    {
        $subscription = $request->user()->subscription('default');

        if ($subscription === null) {
            return response()->json(['message' => __('You do not have an active subscription.')], 422);
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
