<?php

namespace Database\Factories;

use App\Models\CheatSheet;
use App\Models\QuizCategory;
use App\Models\State;
use App\Models\VehicleType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<CheatSheet>
 */
class CheatSheetFactory extends Factory
{
    protected $model = CheatSheet::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->unique()->sentence(3);

        return [
            'quiz_category_id' => QuizCategory::factory(),
            'state_id' => State::factory(),
            'vehicle_type_id' => VehicleType::factory(),
            'title' => $title,
            'slug' => Str::slug($title).'-'.fake()->unique()->numberBetween(1000, 9999),
            'summary' => fake()->sentence(12),
            'is_premium' => true,
            'is_active' => true,
            'order_no' => 0,
        ];
    }
}
