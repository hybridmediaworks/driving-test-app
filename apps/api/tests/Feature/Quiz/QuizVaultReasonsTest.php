<?php

namespace Tests\Feature\Quiz;

use App\Models\ChallengeBankItem;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A question sits in the Quiz Vault for one of two reasons — the learner got it wrong, or they saved
 * it — and the two have to stand on their own. One row used to carry both meanings at once, so
 * answering a question right threw away a bookmark the learner had deliberately kept, and
 * un-bookmarking forgot that they had ever missed it.
 */
class QuizVaultReasonsTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{quiz: Quiz, question: QuizQuestion, correct: QuizAnswer, wrong: QuizAnswer} */
    private function makeQuestion(): array
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create(['sort_order' => 0]);
        $correct = QuizAnswer::factory()->for($question, 'quizQuestion')->correct()->create();
        $wrong = QuizAnswer::factory()->for($question, 'quizQuestion')->create();

        return compact('quiz', 'question', 'correct', 'wrong');
    }

    public function test_a_bookmark_survives_answering_the_question_correctly(): void
    {
        ['quiz' => $quiz, 'question' => $question, 'correct' => $correct, 'wrong' => $wrong] = $this->makeQuestion();
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        // Got it wrong, then saved it on purpose.
        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/check", ['answer_id' => $wrong->id])->assertOk();
        $this->postJson('/api/v1/challenge-bank', ['question_ids' => [$question->id]])->assertCreated();

        // Now answers it right: it is no longer a miss, but it is still saved.
        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/check", ['answer_id' => $correct->id])->assertOk();

        $this->assertDatabaseHas('challenge_bank_items', [
            'user_id' => $user->id,
            'quiz_question_id' => $question->id,
            'missed' => false,
            'bookmarked' => true,
        ]);
        $this->getJson('/api/v1/challenge-bank')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_un_bookmarking_leaves_a_missed_question_in_the_vault(): void
    {
        ['quiz' => $quiz, 'question' => $question, 'wrong' => $wrong] = $this->makeQuestion();
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/check", ['answer_id' => $wrong->id])->assertOk();
        $this->postJson('/api/v1/challenge-bank', ['question_ids' => [$question->id]])->assertCreated();

        $this->deleteJson("/api/v1/challenge-bank/{$question->id}?only=bookmarked")
            ->assertOk()
            ->assertJsonPath('count', 1);

        $this->assertDatabaseHas('challenge_bank_items', [
            'quiz_question_id' => $question->id,
            'missed' => true,
            'bookmarked' => false,
        ]);
    }

    public function test_un_bookmarking_a_question_never_missed_drops_it(): void
    {
        ['question' => $question] = $this->makeQuestion();
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/v1/challenge-bank', ['question_ids' => [$question->id]])->assertCreated();
        $this->deleteJson("/api/v1/challenge-bank/{$question->id}?only=bookmarked")->assertOk();

        // Neither reason left, so the row goes.
        $this->assertDatabaseMissing('challenge_bank_items', ['quiz_question_id' => $question->id]);
    }

    public function test_a_plain_delete_still_clears_both_reasons(): void
    {
        // What "remove from my vault" means, and what the mobile app's clear-all relies on.
        ['quiz' => $quiz, 'question' => $question, 'wrong' => $wrong] = $this->makeQuestion();
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/check", ['answer_id' => $wrong->id])->assertOk();
        $this->postJson('/api/v1/challenge-bank', ['question_ids' => [$question->id]])->assertCreated();

        $this->deleteJson("/api/v1/challenge-bank/{$question->id}")->assertOk()->assertJsonPath('count', 0);

        $this->assertDatabaseMissing('challenge_bank_items', ['quiz_question_id' => $question->id]);
    }

    public function test_the_list_says_why_each_question_is_there(): void
    {
        ['quiz' => $quiz, 'question' => $missed, 'wrong' => $wrong] = $this->makeQuestion();
        $saved = QuizQuestion::factory()->for($quiz, 'quiz')->create(['sort_order' => 1]);
        QuizAnswer::factory()->for($saved, 'quizQuestion')->correct()->create();
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$missed->id}/check", ['answer_id' => $wrong->id])->assertOk();
        $this->postJson('/api/v1/challenge-bank', ['question_ids' => [$saved->id]])->assertCreated();

        $data = collect($this->getJson('/api/v1/challenge-bank')->assertOk()->json('data'))->keyBy('id');

        $this->assertTrue($data[$missed->id]['missed']);
        $this->assertFalse($data[$missed->id]['bookmarked']);
        $this->assertFalse($data[$saved->id]['missed']);
        $this->assertTrue($data[$saved->id]['bookmarked']);
    }

    public function test_bookmarking_a_question_twice_keeps_one_row(): void
    {
        ['question' => $question] = $this->makeQuestion();
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/v1/challenge-bank', ['question_ids' => [$question->id]])->assertCreated();
        $this->postJson('/api/v1/challenge-bank', ['question_ids' => [$question->id]])
            ->assertCreated()
            ->assertJsonPath('count', 1);

        $this->assertSame(1, ChallengeBankItem::query()->where('quiz_question_id', $question->id)->count());
    }
}
