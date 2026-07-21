<?php

namespace App\Console\Commands;

use App\Enums\PlanType;
use App\Models\Plan;
use Illuminate\Console\Command;
use Stripe\StripeClient;

class SyncStripePlans extends Command
{
    protected $signature = 'billing:sync-plans';

    protected $description = 'Create Stripe Products/Prices for any active, paid plan row that does not yet have one, keeping plans.stripe_price_id as the source of truth.';

    public function handle(): int
    {
        $stripe = new StripeClient(config('cashier.secret'));

        $plans = Plan::query()
            ->where('is_active', true)
            ->where('price_cents', '>', 0)
            ->whereNull('stripe_price_id')
            ->get();

        if ($plans->isEmpty()) {
            $this->info('No plans need syncing — every active paid plan already has a Stripe price.');

            return self::SUCCESS;
        }

        foreach ($plans as $plan) {
            $product = $stripe->products->create([
                'name' => $plan->name,
                'active' => true,
            ]);

            $priceParams = [
                'product' => $product->id,
                'unit_amount' => $plan->price_cents,
                'currency' => 'usd',
            ];

            if ($plan->type === PlanType::Recurring) {
                $priceParams['recurring'] = ['interval' => $plan->billing_interval->value];
            }

            $price = $stripe->prices->create($priceParams);

            $plan->update([
                'stripe_product_id' => $product->id,
                'stripe_price_id' => $price->id,
            ]);

            $this->info("Synced \"{$plan->key}\" -> product {$product->id}, price {$price->id}");
        }

        return self::SUCCESS;
    }
}
