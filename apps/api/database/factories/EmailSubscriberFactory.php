<?php

namespace Database\Factories;

use App\Models\EmailSubscriber;
use Illuminate\Database\Eloquent\Factories\Factory;

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
            'unsubscribed_at' => null,
        ];
    }
}
