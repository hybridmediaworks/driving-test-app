<?php

namespace Database\Factories;

use App\Models\AmbientTrack;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<AmbientTrack>
 */
class AmbientTrackFactory extends Factory
{
    protected $model = AmbientTrack::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'quiz_category_id' => null,
            'title' => fake()->unique()->words(3, true),
            'external_url' => 'https://example.com/ambient/'.Str::uuid().'.mp3',
            'is_active' => true,
            'order_no' => 0,
        ];
    }
}
