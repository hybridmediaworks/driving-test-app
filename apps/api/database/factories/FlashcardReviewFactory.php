<?php

namespace Database\Factories;

use App\Models\Flashcard;
use App\Models\FlashcardReview;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FlashcardReview>
 */
class FlashcardReviewFactory extends Factory
{
    protected $model = FlashcardReview::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'flashcard_id' => Flashcard::factory(),
            'status' => 'new',
            'reviewed_at' => null,
        ];
    }
}
