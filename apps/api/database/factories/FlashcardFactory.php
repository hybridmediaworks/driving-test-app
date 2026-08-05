<?php

namespace Database\Factories;

use App\Models\Flashcard;
use App\Models\QuizCategory;
use App\Models\State;
use App\Models\VehicleType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Flashcard>
 */
class FlashcardFactory extends Factory
{
    protected $model = Flashcard::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'quiz_category_id' => QuizCategory::factory(),
            'state_id' => State::factory(),
            'vehicle_type_id' => VehicleType::factory(),
            'front_text' => fake()->sentence(4),
            'back_text' => fake()->paragraph(2),
            'topic' => fake()->word(),
            'is_premium' => true,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }
}
