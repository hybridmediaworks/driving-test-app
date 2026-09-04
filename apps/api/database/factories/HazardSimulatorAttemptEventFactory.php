<?php

namespace Database\Factories;

use App\Models\Hazard;
use App\Models\HazardSimulatorAttempt;
use App\Models\HazardSimulatorAttemptEvent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HazardSimulatorAttemptEvent>
 */
class HazardSimulatorAttemptEventFactory extends Factory
{
    protected $model = HazardSimulatorAttemptEvent::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'hazard_simulator_attempt_id' => HazardSimulatorAttempt::factory(),
            'hazard_id' => Hazard::factory(),
            'kind' => HazardSimulatorAttemptEvent::KIND_HIT,
            'clicked_at_video_ms' => fake()->numberBetween(3000, 120000),
            'reaction_ms' => fake()->numberBetween(200, 2500),
            'pointer_x' => fake()->randomFloat(4, 0, 1),
            'pointer_y' => fake()->randomFloat(4, 0, 1),
        ];
    }

    public function falseClick(): static
    {
        return $this->state(fn () => [
            'hazard_id' => null,
            'kind' => HazardSimulatorAttemptEvent::KIND_FALSE_CLICK,
            'reaction_ms' => null,
        ]);
    }

    public function miss(): static
    {
        return $this->state(fn () => [
            'kind' => HazardSimulatorAttemptEvent::KIND_MISS,
            'clicked_at_video_ms' => null,
            'reaction_ms' => null,
            'pointer_x' => null,
            'pointer_y' => null,
        ]);
    }
}
