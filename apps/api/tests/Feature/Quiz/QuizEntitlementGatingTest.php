<?php

namespace Tests\Feature\Quiz;

use App\Models\Plan;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizQuestion;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizEntitlementGatingTest extends TestCase
{
    use RefreshDatabase;

    private function makePremiumQuizWithQuestion(): array
    {
        $quiz = Quiz::factory()->create(['is_active' => true, 'is_premium' => true]);
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create();
        $correct = QuizAnswer::factory()->for($question, 'quizQuestion')->correct()->create();

        return compact('quiz', 'question', 'correct');
    }

    private function makeActiveSubscriber(string $planKey = 'monthly'): User
    {
        Plan::query()->firstOrCreate(
            ['key' => $planKey],
            ['name' => ucfirst($planKey), 'type' => 'recurring', 'billing_interval' => 'month', 'price_cents' => 7500, 'stripe_price_id' => "price_{$planKey}_gating_test"],
        );

        $user = User::factory()->create(['is_admin' => false]);

        Subscription::query()->create([
            'user_id' => $user->id,
            'type' => 'default',
            'stripe_id' => 'sub_'.uniqid(),
            'stripe_status' => 'active',
            'stripe_price' => "price_{$planKey}_gating_test",
            'quantity' => 1,
        ]);

        return $user;
    }

    public function test_guest_gets_a_locked_teaser_for_a_premium_quiz(): void
    {
        ['quiz' => $quiz] = $this->makePremiumQuizWithQuestion();

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}");

        $response->assertOk();
        $response->assertJsonPath('locked', true);
        $response->assertJsonPath('questions', null);
    }

    public function test_free_registered_user_gets_a_locked_teaser_for_a_premium_quiz(): void
    {
        ['quiz' => $quiz] = $this->makePremiumQuizWithQuestion();
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/v1/quizzes/{$quiz->id}");

        $response->assertOk();
        $response->assertJsonPath('locked', true);
        $response->assertJsonPath('questions', null);
    }

    public function test_admin_sees_full_questions_for_a_premium_quiz(): void
    {
        ['quiz' => $quiz] = $this->makePremiumQuizWithQuestion();
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/quizzes/{$quiz->id}");

        $response->assertOk();
        $response->assertJsonPath('locked', false);
        $this->assertCount(1, $response->json('questions'));
    }

    public function test_active_subscriber_sees_full_questions_for_a_premium_quiz(): void
    {
        ['quiz' => $quiz] = $this->makePremiumQuizWithQuestion();
        $subscriber = $this->makeActiveSubscriber();

        $response = $this->actingAs($subscriber, 'sanctum')->getJson("/api/v1/quizzes/{$quiz->id}");

        $response->assertOk();
        $response->assertJsonPath('locked', false);
        $this->assertCount(1, $response->json('questions'));
    }

    public function test_guest_cannot_submit_an_attempt_for_a_premium_quiz(): void
    {
        ['quiz' => $quiz, 'question' => $question, 'correct' => $correct] = $this->makePremiumQuizWithQuestion();

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [
            'answers' => [
                ['question_id' => $question->id, 'answer_id' => $correct->id],
            ],
        ]);

        $response->assertForbidden();
        $this->assertDatabaseCount('quiz_attempts', 0);
    }

    public function test_free_registered_user_cannot_submit_an_attempt_for_a_premium_quiz(): void
    {
        ['quiz' => $quiz, 'question' => $question, 'correct' => $correct] = $this->makePremiumQuizWithQuestion();
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [
            'answers' => [
                ['question_id' => $question->id, 'answer_id' => $correct->id],
            ],
        ]);

        $response->assertForbidden();
        $this->assertDatabaseCount('quiz_attempts', 0);
    }

    public function test_active_subscriber_can_submit_an_attempt_for_a_premium_quiz(): void
    {
        ['quiz' => $quiz, 'question' => $question, 'correct' => $correct] = $this->makePremiumQuizWithQuestion();
        $subscriber = $this->makeActiveSubscriber();

        $response = $this->actingAs($subscriber, 'sanctum')->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [
            'answers' => [
                ['question_id' => $question->id, 'answer_id' => $correct->id],
            ],
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('quiz_attempts', ['quiz_id' => $quiz->id, 'user_id' => $subscriber->id]);
    }

    public function test_admin_can_submit_an_attempt_for_a_premium_quiz(): void
    {
        ['quiz' => $quiz, 'question' => $question, 'correct' => $correct] = $this->makePremiumQuizWithQuestion();
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [
            'answers' => [
                ['question_id' => $question->id, 'answer_id' => $correct->id],
            ],
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('quiz_attempts', ['quiz_id' => $quiz->id, 'user_id' => $admin->id]);
    }

    public function test_guest_still_gets_full_questions_for_a_non_premium_quiz(): void
    {
        $quiz = Quiz::factory()->create(['is_active' => true, 'is_premium' => false]);
        QuizQuestion::factory()->for($quiz, 'quiz')->create();

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}");

        $response->assertOk();
        $response->assertJsonPath('locked', false);
        $this->assertCount(1, $response->json('questions'));
    }
}
