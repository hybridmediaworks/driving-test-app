<?php

namespace Database\Factories;

use App\Models\EmailSubscriber;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<EmailSubscriber>
 */
class EmailSubscriberFactory extends Factory
{
    protected $model = EmailSubscriber::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'email' => fake()->unique()->safeEmail(),
            'state' => fake()->randomElement(['Alabama', 'California', 'Texas', null]),
            'source' => 'home_hero',
            'unsubscribe_token' => Str::random(40),
            'vehicle_type' => fake()->randomElement(['car', 'motorcycle', 'cdl', null]),
            'last_sent_at' => null,
            'unsubscribed_at' => null,
        ];
    }
}
