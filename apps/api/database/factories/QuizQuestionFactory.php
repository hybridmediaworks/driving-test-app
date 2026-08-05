<?php

namespace Database\Factories;

use App\Enums\QuestionDifficulty;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuizQuestion>
 */
class QuizQuestionFactory extends Factory
{
    protected $model = QuizQuestion::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'quiz_id' => Quiz::factory(),
            'question_text' => fake()->sentence().'?',
            'explanation' => fake()->sentence(),
            'difficulty' => fake()->randomElement(QuestionDifficulty::cases()),
            'topic' => fake()->word(),
            'sort_order' => 0,
        ];
    }
}
