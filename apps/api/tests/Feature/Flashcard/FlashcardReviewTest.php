<?php

namespace Tests\Feature\Flashcard;

use App\Models\Flashcard;
use App\Models\FlashcardReview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FlashcardReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_record_a_review(): void
    {
        $card = Flashcard::factory()->create(['is_premium' => false, 'is_active' => true]);

        $response = $this->postJson("/api/v1/flashcards/{$card->id}/review", ['status' => 'known']);

        $response->assertUnauthorized();
    }

    public function test_authenticated_user_can_record_a_review_for_a_free_card(): void
    {
        $user = User::factory()->create();
        $card = Flashcard::factory()->create(['is_premium' => false, 'is_active' => true]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/flashcards/{$card->id}/review", ['status' => 'known']);

        $response->assertCreated();
        $response->assertJsonPath('review.status', 'known');
        $this->assertDatabaseHas('flashcard_reviews', [
            'user_id' => $user->id,
            'flashcard_id' => $card->id,
            'status' => 'known',
        ]);
    }

    public function test_resubmitting_a_review_upserts_instead_of_duplicating(): void
    {
        $user = User::factory()->create();
        $card = Flashcard::factory()->create(['is_premium' => false, 'is_active' => true]);

        $this->actingAs($user, 'sanctum')->postJson("/api/v1/flashcards/{$card->id}/review", ['status' => 'unknown']);
        $response = $this->actingAs($user, 'sanctum')->postJson("/api/v1/flashcards/{$card->id}/review", ['status' => 'known']);

        $response->assertCreated();
        $this->assertSame(1, FlashcardReview::query()->where(['user_id' => $user->id, 'flashcard_id' => $card->id])->count());
        $this->assertDatabaseHas('flashcard_reviews', [
            'user_id' => $user->id,
            'flashcard_id' => $card->id,
            'status' => 'known',
        ]);
    }

    public function test_invalid_status_value_is_rejected(): void
    {
        $user = User::factory()->create();
        $card = Flashcard::factory()->create(['is_premium' => false, 'is_active' => true]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/flashcards/{$card->id}/review", ['status' => 'maybe']);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['status']);
    }

    public function test_user_cannot_review_a_locked_premium_card_they_are_not_entitled_to(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        $card = Flashcard::factory()->create(['is_premium' => true, 'is_active' => true]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/flashcards/{$card->id}/review", ['status' => 'known']);

        $response->assertForbidden();
        $this->assertDatabaseMissing('flashcard_reviews', ['user_id' => $user->id, 'flashcard_id' => $card->id]);
    }

    public function test_admin_can_review_a_premium_card(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $card = Flashcard::factory()->create(['is_premium' => true, 'is_active' => true]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/flashcards/{$card->id}/review", ['status' => 'known']);

        $response->assertCreated();
    }
}
