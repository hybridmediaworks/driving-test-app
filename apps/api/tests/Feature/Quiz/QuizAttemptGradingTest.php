<?php

namespace Tests\Feature\Quiz;

use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizAttemptGradingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{quiz: Quiz, questions: list<QuizQuestion>, correct: list<QuizAnswer>, wrong: list<QuizAnswer>}
     */
    private function makeQuizWithQuestions(int $count = 3): array
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

    public function test_guest_can_submit_an_attempt_and_gets_a_guest_token(): void
    {
        ['quiz' => $quiz, 'questions' => $questions, 'correct' => $correct] = $this->makeQuizWithQuestions(2);

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [
            'answers' => [
                ['question_id' => $questions[0]->id, 'answer_id' => $correct[0]->id],
                ['question_id' => $questions[1]->id, 'answer_id' => $correct[1]->id],
            ],
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('quiz_attempts', [
            'quiz_id' => $quiz->id,
            'user_id' => null,
            'score' => 100,
            'correct_count' => 2,
            'total_questions' => 2,
        ]);

        $attempt = QuizAttempt::firstOrFail();
        $this->assertNotNull($attempt->guest_token);
    }

    public function test_authenticated_user_attempt_attaches_user_id_and_has_no_guest_token(): void
    {
        ['quiz' => $quiz, 'questions' => $questions, 'correct' => $correct] = $this->makeQuizWithQuestions(1);
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [
            'answers' => [
                ['question_id' => $questions[0]->id, 'answer_id' => $correct[0]->id],
            ],
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('quiz_attempts', [
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'guest_token' => null,
        ]);
    }

    public function test_mixed_correct_and_incorrect_answers_are_scored_accurately(): void
    {
        ['quiz' => $quiz, 'questions' => $questions, 'correct' => $correct, 'wrong' => $wrong] = $this->makeQuizWithQuestions(4);

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [
            'answers' => [
                ['question_id' => $questions[0]->id, 'answer_id' => $correct[0]->id],
                ['question_id' => $questions[1]->id, 'answer_id' => $wrong[1]->id],
                ['question_id' => $questions[2]->id, 'answer_id' => $correct[2]->id],
                ['question_id' => $questions[3]->id, 'answer_id' => $wrong[3]->id],
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('attempt.correct_count', 2);
        $response->assertJsonPath('attempt.total_questions', 4);
        $response->assertJsonPath('attempt.score', 50);

        $answers = collect($response->json('attempt.answers'))->keyBy('question_id');
        $this->assertTrue($answers[$questions[0]->id]['is_correct']);
        $this->assertFalse($answers[$questions[1]->id]['is_correct']);
        $this->assertTrue($answers[$questions[2]->id]['is_correct']);
        $this->assertFalse($answers[$questions[3]->id]['is_correct']);
    }

    public function test_omitted_question_is_not_recorded_but_still_counts_toward_total(): void
    {
        ['quiz' => $quiz, 'questions' => $questions, 'correct' => $correct] = $this->makeQuizWithQuestions(3);

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [
            'answers' => [
                ['question_id' => $questions[0]->id, 'answer_id' => $correct[0]->id],
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('attempt.total_questions', 3);
        $response->assertJsonPath('attempt.correct_count', 1);
        $this->assertCount(1, $response->json('attempt.answers'));
    }

    public function test_explicit_null_answer_id_is_recorded_as_incorrect(): void
    {
        ['quiz' => $quiz, 'questions' => $questions] = $this->makeQuizWithQuestions(1);

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [
            'answers' => [
                ['question_id' => $questions[0]->id, 'answer_id' => null],
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('attempt.correct_count', 0);
        $response->assertJsonPath('attempt.answers.0.is_correct', false);
        $response->assertJsonPath('attempt.answers.0.selected_answer_id', null);
    }

    public function test_answer_id_belonging_to_a_different_question_is_not_accepted_as_correct(): void
    {
        ['quiz' => $quiz, 'questions' => $questions, 'correct' => $correct] = $this->makeQuizWithQuestions(2);

        // Submit question 0 with question 1's correct answer id — must not be graded as correct.
        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [
            'answers' => [
                ['question_id' => $questions[0]->id, 'answer_id' => $correct[1]->id],
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('attempt.correct_count', 0);
        $response->assertJsonPath('attempt.answers.0.is_correct', false);
        $response->assertJsonPath('attempt.answers.0.selected_answer_id', null);
    }

    public function test_question_id_not_belonging_to_the_quiz_is_rejected(): void
    {
        ['quiz' => $quiz] = $this->makeQuizWithQuestions(1);
        $otherQuestion = QuizQuestion::factory()->create();

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [
            'answers' => [
                ['question_id' => $otherQuestion->id, 'answer_id' => null],
            ],
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['answers.0.question_id']);
    }

    public function test_duplicate_question_ids_in_the_same_submission_are_rejected(): void
    {
        ['quiz' => $quiz, 'questions' => $questions, 'correct' => $correct] = $this->makeQuizWithQuestions(1);

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [
            'answers' => [
                ['question_id' => $questions[0]->id, 'answer_id' => $correct[0]->id],
                ['question_id' => $questions[0]->id, 'answer_id' => null],
            ],
        ]);

        $response->assertUnprocessable();
    }

    public function test_cannot_submit_an_attempt_for_an_inactive_quiz(): void
    {
        ['quiz' => $quiz, 'questions' => $questions] = $this->makeQuizWithQuestions(1);
        $quiz->update(['is_active' => false]);

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [
            'answers' => [
                ['question_id' => $questions[0]->id, 'answer_id' => null],
            ],
        ]);

        $response->assertForbidden();
    }
}
