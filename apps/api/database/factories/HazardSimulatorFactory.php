<?php

namespace Database\Factories;

use App\Models\HazardSimulator;
use App\Models\Video;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HazardSimulator>
 */
class HazardSimulatorFactory extends Factory
{
    protected $model = HazardSimulator::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'video_id' => Video::factory()->state([
                'section' => 'Defensive Driving Hazard Simulators',
                'is_premium' => true,
            ]),
            'slug' => 'hazard-simulator-'.fake()->unique()->numberBetween(1000, 999999),
            'sim_id' => fake()->unique()->numberBetween(1000, 99999),
            'page_id' => fake()->numberBetween(1000, 99999),
            'provider' => 'vimeo',
            'provider_video_id' => (string) fake()->numberBetween(100000000, 999999999),
            'test_level' => fake()->randomElement(['Easy', 'Medium', 'Hard']),
            'test_location' => fake()->city().', '.fake()->stateAbbr(),
            'test_number' => (string) fake()->numberBetween(1, 20),
            'hazard_count' => 6,
            'demo_hazard_count' => 2,
            'pass_threshold_percent' => null,
            'scoring_profile' => 'standard',
            'is_active' => true,
        ];
    }

    public function withThreshold(int $percent): static
    {
        return $this->state(fn () => ['pass_threshold_percent' => $percent]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
