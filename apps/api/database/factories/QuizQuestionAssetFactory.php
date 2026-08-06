<?php

namespace Database\Factories;

use App\Models\QuizQuestion;
use App\Models\QuizQuestionAsset;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<QuizQuestionAsset>
 */
class QuizQuestionAssetFactory extends Factory
{
    protected $model = QuizQuestionAsset::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'quiz_question_id' => QuizQuestion::factory(),
            'type' => 'video',
            'external_url' => 'https://example.com/clips/'.Str::uuid().'.mp4',
            'duration_seconds' => fake()->numberBetween(5, 60),
            'sort_order' => 0,
        ];
    }
}
