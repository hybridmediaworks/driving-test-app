<?php

namespace Database\Factories;

use App\Models\QuizCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<QuizCategory>
 */
class QuizCategoryFactory extends Factory
{
    protected $model = QuizCategory::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->unique()->words(2, true);

        return [
            'name' => Str::slug($title),
            'title' => ucfirst($title),
            'description' => fake()->sentence(),
            'order_no' => 0,
            'is_active' => true,
        ];
    }
}
