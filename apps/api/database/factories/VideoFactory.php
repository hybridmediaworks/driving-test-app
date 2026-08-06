<?php

namespace Database\Factories;

use App\Models\Video;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Video>
 */
class VideoFactory extends Factory
{
    protected $model = Video::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->unique()->sentence(3);

        return [
            'quiz_category_id' => null,
            'state_id' => null,
            'vehicle_type_id' => null,
            'test_track' => null,
            'title' => $title,
            'slug' => Str::slug($title).'-'.fake()->unique()->numberBetween(1000, 9999),
            'description' => fake()->sentence(12),
            'duration_seconds' => fake()->numberBetween(60, 900),
            'external_url' => 'https://example.com/videos/'.Str::uuid().'.mp4',
            'is_premium' => true,
            'is_active' => true,
            'order_no' => 0,
        ];
    }
}
