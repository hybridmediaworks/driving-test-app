<?php

namespace Database\Factories;

use App\Models\VehicleType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<VehicleType>
 */
class VehicleTypeFactory extends Factory
{
    protected $model = VehicleType::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->unique()->words(2, true);

        return [
            'name' => Str::slug($title),
            'title' => ucfirst($title),
            'is_active' => true,
        ];
    }
}
