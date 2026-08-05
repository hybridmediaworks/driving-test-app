<?php

namespace App\Actions\Billing;

use App\Enums\PlanType;
use App\Models\Plan;
use App\Models\User;

class CreateCheckoutSession
{
    public function __invoke(User $user, Plan $plan): string
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        $sessionOptions = [
            'success_url' => "{$frontendUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}",
            'cancel_url' => "{$frontendUrl}/billing/cancel",
            // Stripe's "Managed Payments" (auto-enabled on newer accounts) requires every product
            // to carry a tax_code and will otherwise reject the session outright. This app hasn't
            // opted into Stripe Tax/Managed Payments — disable it per-session rather than assign
            // a tax code we're not authoritative on for this business.
            'managed_payments' => ['enabled' => false],
        ];

        if ($plan->type === PlanType::Recurring) {
            $checkout = $user->newSubscription('default', $plan->stripe_price_id)->checkout($sessionOptions);
        } else {
            $checkout = $user->checkout([$plan->stripe_price_id => 1], [
                ...$sessionOptions,
                'mode' => 'payment',
                'metadata' => ['plan_id' => (string) $plan->id],
            ]);
        }

        return $checkout->url;
    }
}
