<?php

namespace Database\Factories;

use App\Enums\HazardType;
use App\Models\Hazard;
use App\Models\HazardSimulator;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Hazard>
 */
class HazardFactory extends Factory
{
    protected $model = Hazard::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $start = fake()->randomFloat(3, 3, 100);

        return [
            'hazard_simulator_id' => HazardSimulator::factory(),
            'source_hazard_id' => fake()->unique()->numberBetween(1, 100000),
            'type_raw' => 'vehicle',
            'type' => HazardType::Vehicle,
            'hazard_group' => null,
            'mode' => 'assessment',
            'in_timeline' => true,
            'sort_order' => fake()->numberBetween(0, 10),
            'time_start' => $start,
            'time_end' => $start + fake()->randomFloat(3, 3, 8),
            'frame_count' => fake()->numberBetween(5, 20),
            'box' => null,
            'comment' => fake()->sentence(10),
            'audio_url' => 'https://driving-tests.org/audio/hazards/'.fake()->numberBetween(1000, 9999).'.mp3',
        ];
    }

    public function demo(): static
    {
        return $this->state(fn () => ['mode' => 'demo']);
    }

    public function poolOnly(): static
    {
        return $this->state(fn () => ['in_timeline' => false, 'sort_order' => null]);
    }

    public function window(float $start, float $end): static
    {
        return $this->state(fn () => ['time_start' => $start, 'time_end' => $end]);
    }
}
