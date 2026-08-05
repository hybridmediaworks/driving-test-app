<?php

namespace Database\Factories;

use App\Enums\BillingInterval;
use App\Enums\PlanType;
use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Plan>
 */
class PlanFactory extends Factory
{
    protected $model = Plan::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'key' => fake()->unique()->slug(2),
            'name' => fake()->words(2, true),
            'type' => PlanType::Recurring,
            'billing_interval' => BillingInterval::Month,
            'price_cents' => fake()->numberBetween(1000, 20000),
            'stripe_price_id' => null,
            'stripe_product_id' => null,
            'max_seats' => 1,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }
}
