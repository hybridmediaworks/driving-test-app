<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\VehicleType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

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
                'vehicle' => 'car',
                'name' => 'Weekly',
                'type' => 'recurring',
                'billing_interval' => 'week',
                'price_cents' => 2900,
                'trial_days' => 7,
                'max_seats' => 1,
                'sort_order' => 0,
            ],
            [
                'key' => 'monthly',
                'vehicle' => 'car',
                'name' => 'Monthly',
                'type' => 'recurring',
                'billing_interval' => 'month',
                'price_cents' => 7500,
                'max_seats' => 1,
                'sort_order' => 1,
            ],
            [
                'key' => 'lifetime_family',
                'vehicle' => 'car',
                'name' => 'Lifetime Family',
                'type' => 'one_time',
                'billing_interval' => null,
                'price_cents' => 19900,
                'max_seats' => 3,
                'sort_order' => 2,
            ],
            ['key' => 'cdl_weekly', 'vehicle' => 'cdl', 'name' => 'Weekly', 'type' => 'recurring', 'billing_interval' => 'week', 'price_cents' => 4900, 'trial_days' => 7, 'max_seats' => 1, 'sort_order' => 0],
            ['key' => 'cdl_monthly', 'vehicle' => 'cdl', 'name' => 'Monthly', 'type' => 'recurring', 'billing_interval' => 'month', 'price_cents' => 8900, 'max_seats' => 1, 'sort_order' => 1],
            ['key' => 'motorcycle_weekly', 'vehicle' => 'motorcycle', 'name' => 'Weekly', 'type' => 'recurring', 'billing_interval' => 'week', 'price_cents' => 2900, 'trial_days' => 7, 'max_seats' => 1, 'sort_order' => 0],
            ['key' => 'motorcycle_monthly', 'vehicle' => 'motorcycle', 'name' => 'Monthly', 'type' => 'recurring', 'billing_interval' => 'month', 'price_cents' => 7500, 'max_seats' => 1, 'sort_order' => 1],
        ];

        $vehicleIds = VehicleType::query()->pluck('id', 'name');

        foreach ($plans as $plan) {
            $vehicle = Arr::pull($plan, 'vehicle');

            Plan::query()->updateOrCreate(['key' => $plan['key']], [
                ...$plan,
                'vehicle_type_id' => $vehicleIds[$vehicle] ?? null,
                'is_active' => true,
            ]);
        }
    }
}
