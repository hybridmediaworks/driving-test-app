<?php

namespace Tests\Feature;

use App\Enums\AttemptStatus;
use App\Models\CheatSheet;
use App\Models\Flashcard;
use App\Models\FlashcardReview;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_view_their_stats(): void
    {
        $response = $this->getJson('/api/v1/me/stats');

        $response->assertUnauthorized();
    }

    public function test_authenticated_user_sees_only_their_own_attempt_and_flashcard_stats(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $quiz = Quiz::factory()->create();

        QuizAttempt::query()->create([
            'user_id' => $user->id,
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 2,
            'correct_count' => 2,
            'score' => 100,
            'passed' => true,
            'started_at' => now(),
            'completed_at' => now(),
        ]);
        QuizAttempt::query()->create([
            'user_id' => $user->id,
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::InProgress,
            'total_questions' => 2,
            'correct_count' => 0,
            'score' => 0,
            'started_at' => now(),
        ]);
        QuizAttempt::query()->create([
            'user_id' => $otherUser->id,
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 2,
            'correct_count' => 0,
            'score' => 0,
            'passed' => false,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $knownCard = Flashcard::factory()->create(['is_active' => true, 'is_premium' => false]);
        $unknownCard = Flashcard::factory()->create(['is_active' => true, 'is_premium' => false]);
        Flashcard::factory()->create(['is_active' => false, 'is_premium' => false]);
        FlashcardReview::factory()->create(['user_id' => $user->id, 'flashcard_id' => $knownCard->id, 'status' => 'known']);
        FlashcardReview::factory()->create(['user_id' => $user->id, 'flashcard_id' => $unknownCard->id, 'status' => 'unknown']);
        FlashcardReview::factory()->create(['user_id' => $otherUser->id, 'flashcard_id' => $knownCard->id, 'status' => 'known']);

        CheatSheet::factory()->create(['is_active' => true]);
        CheatSheet::factory()->create(['is_active' => false]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/me/stats');

        $response->assertOk();
        $response->assertJsonStructure([
            'attempts' => ['total', 'completed', 'in_progress', 'passed', 'average_score', 'last_7_days'],
            'flashcards' => ['total_active', 'known', 'unknown'],
            'cheat_sheets' => ['total_active'],
        ]);

        $response->assertJsonPath('attempts.total', 2);
        $response->assertJsonPath('attempts.completed', 1);
        $response->assertJsonPath('attempts.in_progress', 1);
        $response->assertJsonPath('attempts.passed', 1);
        $this->assertEquals(100.0, $response->json('attempts.average_score'));

        $response->assertJsonPath('flashcards.total_active', 2);
        $response->assertJsonPath('flashcards.known', 1);
        $response->assertJsonPath('flashcards.unknown', 1);

        $response->assertJsonPath('cheat_sheets.total_active', 1);
    }
}
