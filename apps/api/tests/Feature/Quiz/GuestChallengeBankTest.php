<?php

namespace Tests\Feature\Quiz;

use App\Models\ChallengeBankItem;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * A signed-out (guest) learner builds a Challenge Bank ("Quiz Vault") too: their wrong questions are
 * filed under the per-install X-Guest-Token, kept in sync as they answer, readable back with that
 * token, and claimed into their account when they eventually sign in.
 */
class GuestChallengeBankTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{quiz: Quiz, questions: list<QuizQuestion>, correct: list<QuizAnswer>, wrong: list<QuizAnswer>}
     */
    private function makeQuizWithQuestions(int $count = 2): array
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $questions = [];
        $correct = [];
        $wrong = [];

        for ($i = 0; $i < $count; $i++) {
            $question = QuizQuestion::factory()->for($quiz, 'quiz')->create(['sort_order' => $i]);
            $correct[] = QuizAnswer::factory()->for($question, 'quizQuestion')->correct()->create();
            $wrong[] = QuizAnswer::factory()->for($question, 'quizQuestion')->create();
            $questions[] = $question;
        }

        return compact('quiz', 'questions', 'correct', 'wrong');
    }

    public function test_guest_wrong_answer_via_check_files_it_to_their_bank(): void
    {
        ['quiz' => $quiz, 'questions' => $questions, 'wrong' => $wrong] = $this->makeQuizWithQuestions(1);

        $this->withHeader('X-Guest-Token', 'guest-1')
            ->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$questions[0]->id}/check", [
                'answer_id' => $wrong[0]->id,
            ])
            ->assertOk()
            ->assertJsonPath('is_correct', false);

        $this->assertDatabaseHas('challenge_bank_items', [
            'guest_token' => 'guest-1',
            'user_id' => null,
            'quiz_question_id' => $questions[0]->id,
        ]);
    }

    public function test_guest_correct_answer_clears_it_from_their_bank(): void
    {
        ['quiz' => $quiz, 'questions' => $questions, 'correct' => $correct, 'wrong' => $wrong] = $this->makeQuizWithQuestions(1);

        // Get it wrong first — now it's banked.
        $this->withHeader('X-Guest-Token', 'guest-2')
            ->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$questions[0]->id}/check", ['answer_id' => $wrong[0]->id])
            ->assertOk();
        $this->assertDatabaseHas('challenge_bank_items', ['guest_token' => 'guest-2', 'quiz_question_id' => $questions[0]->id]);

        // Then get it right — it graduates out.
        $this->withHeader('X-Guest-Token', 'guest-2')
            ->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$questions[0]->id}/check", ['answer_id' => $correct[0]->id])
            ->assertOk()
            ->assertJsonPath('is_correct', true);

        $this->assertDatabaseMissing('challenge_bank_items', ['guest_token' => 'guest-2', 'quiz_question_id' => $questions[0]->id]);
    }

    public function test_guest_full_submit_files_wrong_and_clears_correct(): void
    {
        ['quiz' => $quiz, 'questions' => $questions, 'correct' => $correct, 'wrong' => $wrong] = $this->makeQuizWithQuestions(2);

        $this->withHeader('X-Guest-Token', 'guest-3')
            ->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [
                'answers' => [
                    ['question_id' => $questions[0]->id, 'answer_id' => $wrong[0]->id],
                    ['question_id' => $questions[1]->id, 'answer_id' => $correct[1]->id],
                ],
            ])
            ->assertCreated();

        $this->assertDatabaseHas('challenge_bank_items', ['guest_token' => 'guest-3', 'quiz_question_id' => $questions[0]->id]);
        $this->assertDatabaseMissing('challenge_bank_items', ['guest_token' => 'guest-3', 'quiz_question_id' => $questions[1]->id]);
    }

    public function test_guest_can_read_back_only_their_own_bank(): void
    {
        ['quiz' => $quiz, 'questions' => $questions, 'wrong' => $wrong] = $this->makeQuizWithQuestions(1);

        $this->withHeader('X-Guest-Token', 'guest-a')
            ->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$questions[0]->id}/check", ['answer_id' => $wrong[0]->id])
            ->assertOk();

        // Owner sees the banked question.
        $this->withHeader('X-Guest-Token', 'guest-a')
            ->getJson('/api/v1/challenge-bank')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $questions[0]->id);

        // A different guest sees an empty bank.
        $this->withHeader('X-Guest-Token', 'guest-b')
            ->getJson('/api/v1/challenge-bank')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_guest_delete_removes_only_their_row(): void
    {
        ['quiz' => $quiz, 'questions' => $questions, 'wrong' => $wrong] = $this->makeQuizWithQuestions(1);

        $this->withHeader('X-Guest-Token', 'guest-del')
            ->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$questions[0]->id}/check", ['answer_id' => $wrong[0]->id])
            ->assertOk();

        $this->withHeader('X-Guest-Token', 'guest-del')
            ->deleteJson("/api/v1/challenge-bank/{$questions[0]->id}")
            ->assertOk()
            ->assertJsonPath('count', 0);

        $this->assertDatabaseMissing('challenge_bank_items', ['guest_token' => 'guest-del', 'quiz_question_id' => $questions[0]->id]);
    }

    public function test_login_claims_the_guest_bank_into_the_account(): void
    {
        ['quiz' => $quiz, 'questions' => $questions, 'wrong' => $wrong] = $this->makeQuizWithQuestions(1);
        $user = User::factory()->create(['password' => Hash::make('password123')]);

        // Build a guest bank.
        $this->withHeader('X-Guest-Token', 'guest-claim')
            ->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$questions[0]->id}/check", ['answer_id' => $wrong[0]->id])
            ->assertOk();

        // Sign in with the same guest token attached.
        $this->withHeader('X-Guest-Token', 'guest-claim')->postJson('/api/v1/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])->assertOk();

        $this->assertDatabaseHas('challenge_bank_items', [
            'user_id' => $user->id,
            'guest_token' => null,
            'quiz_question_id' => $questions[0]->id,
        ]);
        $this->assertDatabaseMissing('challenge_bank_items', ['guest_token' => 'guest-claim']);
    }

    public function test_claim_drops_a_guest_duplicate_the_account_already_had(): void
    {
        ['quiz' => $quiz, 'questions' => $questions, 'wrong' => $wrong] = $this->makeQuizWithQuestions(1);
        $user = User::factory()->create(['password' => Hash::make('password123')]);

        // Account already has this question banked.
        ChallengeBankItem::create(['user_id' => $user->id, 'quiz_question_id' => $questions[0]->id]);

        // Guest banks the same question.
        $this->withHeader('X-Guest-Token', 'dup-guest')
            ->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$questions[0]->id}/check", ['answer_id' => $wrong[0]->id])
            ->assertOk();

        $this->withHeader('X-Guest-Token', 'dup-guest')->postJson('/api/v1/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])->assertOk();

        // Exactly one row survives — the account's — and no guest row is left dangling.
        $this->assertSame(1, ChallengeBankItem::query()->where('quiz_question_id', $questions[0]->id)->count());
        $this->assertDatabaseMissing('challenge_bank_items', ['guest_token' => 'dup-guest']);
    }

    public function test_a_caller_with_no_identity_gets_an_empty_bank(): void
    {
        $this->getJson('/api/v1/challenge-bank')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
