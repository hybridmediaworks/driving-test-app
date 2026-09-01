<?php

namespace Database\Factories;

use App\Models\Expert;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Expert>
 */
class ExpertFactory extends Factory
{
    protected $model = Expert::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->name();

        return [
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1, 99999),
            'name' => $name,
            'title' => 'DMV Content Reviewer',
            'credentials' => 'M.S., DMV Content Reviewer',
            'role_label' => 'Reviewed for legal and handbook accuracy',
            'intro' => fake()->paragraph(),
            'linkedin_url' => 'https://www.linkedin.com/in/'.fake()->userName(),
            'email' => fake()->safeEmail(),
            'sections' => [
                ['heading' => 'Education', 'body' => fake()->sentence()],
                ['heading' => 'Methodology', 'body' => fake()->paragraph()],
            ],
            'verified_at' => now()->subDays(fake()->numberBetween(0, 30))->toDateString(),
            'sort_order' => 0,
            'is_published' => true,
        ];
    }

    public function unpublished(): static
    {
        return $this->state(fn (): array => ['is_published' => false]);
    }
}
