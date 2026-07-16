<?php

namespace Database\Factories;

use App\Models\QuizType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<QuizType>
 */
class QuizTypeFactory extends Factory
{
    protected $model = QuizType::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->unique()->words(2, true);

        return [
            'name' => Str::slug($title),
            'title' => ucfirst($title),
        ];
    }
}
