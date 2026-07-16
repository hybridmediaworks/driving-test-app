<?php

namespace Database\Factories;

use App\Models\Quiz;
use App\Models\QuizCategory;
use App\Models\QuizType;
use App\Models\State;
use App\Models\VehicleType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Quiz>
 */
class QuizFactory extends Factory
{
    protected $model = Quiz::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->unique()->sentence(3);

        return [
            'quiz_category_id' => QuizCategory::factory(),
            'quiz_type_id' => QuizType::factory(),
            'state_id' => State::factory(),
            'vehicle_type_id' => VehicleType::factory(),
            'title' => $title,
            'slug' => Str::slug($title).'-'.fake()->unique()->numberBetween(1000, 9999),
            'test_track' => fake()->randomElement(['permit_test', 'driving_test']),
            'order_no' => 0,
            'duration_seconds' => 1800,
            'is_premium' => false,
            'is_active' => true,
        ];
    }
}
