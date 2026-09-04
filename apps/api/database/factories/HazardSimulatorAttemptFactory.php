<?php

namespace Database\Factories;

use App\Enums\HazardAttemptStatus;
use App\Models\HazardSimulator;
use App\Models\HazardSimulatorAttempt;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<HazardSimulatorAttempt>
 */
class HazardSimulatorAttemptFactory extends Factory
{
    protected $model = HazardSimulatorAttempt::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'guest_token' => null,
            'hazard_simulator_id' => HazardSimulator::factory(),
            'status' => HazardAttemptStatus::Completed,
            'score' => fake()->numberBetween(20, 90),
            'passed' => null,
            'hazards_spotted' => fake()->numberBetween(1, 6),
            'hazards_total' => 6,
            'avg_reaction_ms' => fake()->numberBetween(400, 2000),
            'reaction_band' => fake()->randomElement(['fast', 'average', 'slow']),
            'false_clicks' => fake()->numberBetween(0, 20),
            'started_at' => now()->subMinutes(3),
            'completed_at' => now(),
            'duration_seconds' => fake()->numberBetween(120, 180),
        ];
    }

    public function guest(?string $token = null): static
    {
        return $this->state(fn () => [
            'user_id' => null,
            'guest_token' => $token ?? (string) Str::uuid(),
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn () => [
            'status' => HazardAttemptStatus::InProgress,
            'score' => null,
            'completed_at' => null,
        ]);
    }
}
