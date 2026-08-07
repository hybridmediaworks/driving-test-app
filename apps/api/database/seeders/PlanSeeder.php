<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Seeds the paid plans from docs/SUBSCRIPTION_ROADMAP.md. No plan row for "free" — that's not
     * a purchasable plan, just the fallback `EntitlementTier::Free` a registered user with no
     * subscription resolves to; there's nothing to check out. `stripe_price_id`/`stripe_product_id`
     * are left null — those only exist once real Stripe Dashboard products are created (Subscription
     * Roadmap M3+), which needs a live Stripe account this seeder has no access to. Checkout for a
     * plan with a null stripe_price_id simply isn't wired up yet; the schema/entitlement side of
     * the system doesn't need it to function.
     */
    public function run(): void
    {
        $plans = [
            [
                'key' => 'weekly',
                'name' => 'Weekly',
                'type' => 'recurring',
                'billing_interval' => 'week',
                'price_cents' => 2900,
                // The only plan with a free trial — card required at checkout, auto-converts to
                // a paid weekly subscription if not canceled first.
                'trial_days' => 7,
                'max_seats' => 1,
                'sort_order' => 0,
            ],
            [
                'key' => 'monthly',
                'name' => 'Monthly',
                'type' => 'recurring',
                'billing_interval' => 'month',
                'price_cents' => 7500,
                'max_seats' => 1,
                'sort_order' => 1,
            ],
            [
                'key' => 'lifetime_family',
                'name' => 'Lifetime Family',
                'type' => 'one_time',
                'billing_interval' => null,
                'price_cents' => 19900,
                'max_seats' => 3,
                'sort_order' => 2,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::query()->updateOrCreate(['key' => $plan['key']], [
                ...$plan,
                'is_active' => true,
            ]);
        }
    }
}
