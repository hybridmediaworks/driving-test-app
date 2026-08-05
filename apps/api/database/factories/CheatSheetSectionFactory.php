<?php

namespace Database\Factories;

use App\Models\CheatSheet;
use App\Models\CheatSheetSection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CheatSheetSection>
 */
class CheatSheetSectionFactory extends Factory
{
    protected $model = CheatSheetSection::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'cheat_sheet_id' => CheatSheet::factory(),
            'heading' => fake()->sentence(3),
            'body_markdown' => "- ".implode("\n- ", fake()->sentences(3)),
            'sort_order' => 0,
        ];
    }
}
