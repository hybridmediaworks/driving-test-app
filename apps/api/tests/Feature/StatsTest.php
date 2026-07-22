<?php

namespace Tests\Feature;

use App\Enums\AttemptStatus;
use App\Models\CheatSheet;
use App\Models\Flashcard;
use App\Models\FlashcardReview;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizCategory;
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
            'attempts' => ['total', 'completed', 'in_progress', 'passed', 'average_score', 'last_7_days', 'recent_scores'],
            'flashcards' => ['total_active', 'known', 'unknown'],
            'cheat_sheets' => ['total_active'],
            'categories',
        ]);

        $response->assertJsonPath('attempts.total', 2);
        $response->assertJsonPath('attempts.completed', 1);
        $response->assertJsonPath('attempts.in_progress', 1);
        $response->assertJsonPath('attempts.passed', 1);
        $this->assertEquals(100.0, $response->json('attempts.average_score'));
        $response->assertJsonPath('attempts.recent_scores', [100]);

        $response->assertJsonPath('flashcards.total_active', 2);
        $response->assertJsonPath('flashcards.known', 1);
        $response->assertJsonPath('flashcards.unknown', 1);

        $response->assertJsonPath('cheat_sheets.total_active', 1);
    }

    public function test_recent_scores_are_chronological_and_capped_at_ten(): void
    {
        $user = User::factory()->create();
        $quiz = Quiz::factory()->create();

        foreach ([60, 70, 80] as $i => $score) {
            QuizAttempt::query()->create([
                'user_id' => $user->id,
                'quiz_id' => $quiz->id,
                'status' => AttemptStatus::Completed,
                'total_questions' => 2,
                'correct_count' => 1,
                'score' => $score,
                'passed' => true,
                'started_at' => now(),
                'completed_at' => now()->addMinutes($i),
            ]);
        }

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/me/stats');

        $response->assertOk();
        $response->assertJsonPath('attempts.recent_scores', [60, 70, 80]);
    }

    public function test_categories_report_average_score_per_quiz_category_for_completed_attempts_only(): void
    {
        $user = User::factory()->create();
        $signs = QuizCategory::factory()->create(['title' => 'Road Signs']);
        $rules = QuizCategory::factory()->create(['title' => 'Right of Way']);
        $signQuiz = Quiz::factory()->create(['quiz_category_id' => $signs->id]);
        $ruleQuiz = Quiz::factory()->create(['quiz_category_id' => $rules->id]);

        QuizAttempt::query()->create([
            'user_id' => $user->id, 'quiz_id' => $signQuiz->id, 'status' => AttemptStatus::Completed,
            'total_questions' => 2, 'correct_count' => 2, 'score' => 90, 'passed' => true,
            'started_at' => now(), 'completed_at' => now(),
        ]);
        QuizAttempt::query()->create([
            'user_id' => $user->id, 'quiz_id' => $signQuiz->id, 'status' => AttemptStatus::Completed,
            'total_questions' => 2, 'correct_count' => 2, 'score' => 70, 'passed' => true,
            'started_at' => now(), 'completed_at' => now(),
        ]);
        QuizAttempt::query()->create([
            'user_id' => $user->id, 'quiz_id' => $ruleQuiz->id, 'status' => AttemptStatus::Completed,
            'total_questions' => 2, 'correct_count' => 1, 'score' => 50, 'passed' => false,
            'started_at' => now(), 'completed_at' => now(),
        ]);
        QuizAttempt::query()->create([
            'user_id' => $user->id, 'quiz_id' => $signQuiz->id, 'status' => AttemptStatus::InProgress,
            'total_questions' => 2, 'correct_count' => 0, 'score' => 0,
            'started_at' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/me/stats');

        $response->assertOk();
        $categories = collect($response->json('categories'));
        $this->assertCount(2, $categories);

        $signsRow = $categories->firstWhere('name', 'Road Signs');
        $this->assertEquals(80.0, $signsRow['average_score']);
        $this->assertSame(2, $signsRow['attempts_count']);

        $rulesRow = $categories->firstWhere('name', 'Right of Way');
        $this->assertEquals(50.0, $rulesRow['average_score']);
        $this->assertSame(1, $rulesRow['attempts_count']);
    }
}
