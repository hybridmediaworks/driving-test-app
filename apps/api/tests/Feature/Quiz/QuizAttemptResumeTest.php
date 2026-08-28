<?php

namespace Tests\Feature\Quiz;

use App\Enums\AttemptStatus;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizAttemptResumeTest extends TestCase
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

    public function test_starting_a_quiz_creates_an_in_progress_attempt_with_a_persisted_question_order(): void
    {
        ['quiz' => $quiz, 'questions' => $questions] = $this->makeQuizWithQuestions(3);

        $response = $this->postJson(
            "/api/v1/quizzes/{$quiz->id}/attempts/start",
            [],
            ['X-Guest-Token' => 'guest-abc'],
        );

        $response->assertOk();
        $response->assertJsonPath('attempt.total_questions', 3);
        $response->assertJsonCount(3, 'attempt.question_order');
        $this->assertEqualsCanonicalizing(
            collect($questions)->pluck('id')->all(),
            $response->json('attempt.question_order'),
        );
        $response->assertJsonPath('answers', []);

        $this->assertDatabaseHas('quiz_attempts', [
            'quiz_id' => $quiz->id,
            'guest_token' => 'guest-abc',
            'status' => AttemptStatus::InProgress->value,
        ]);
    }

    public function test_starting_the_same_quiz_again_resumes_the_existing_attempt_instead_of_creating_a_new_one(): void
    {
        ['quiz' => $quiz] = $this->makeQuizWithQuestions(2);
        $headers = ['X-Guest-Token' => 'guest-resume'];

        $first = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts/start", [], $headers);
        $second = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts/start", [], $headers);

        $first->assertOk();
        $second->assertOk();
        $this->assertSame($first->json('attempt.id'), $second->json('attempt.id'));
        $this->assertSame(1, QuizAttempt::query()->count());
    }

    public function test_checking_an_answer_with_an_attempt_id_persists_it_and_a_later_start_rehydrates_it(): void
    {
        ['quiz' => $quiz, 'questions' => $questions, 'correct' => $correct] = $this->makeQuizWithQuestions(2);
        $headers = ['X-Guest-Token' => 'guest-check'];

        $start = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts/start", [], $headers);
        $attemptId = $start->json('attempt.id');

        $check = $this->postJson(
            "/api/v1/quizzes/{$quiz->id}/questions/{$questions[0]->id}/check",
            ['answer_id' => $correct[0]->id, 'attempt_id' => $attemptId],
            $headers,
        );
        $check->assertOk();

        $this->assertDatabaseHas('quiz_attempt_answers', [
            'quiz_attempt_id' => $attemptId,
            'quiz_question_id' => $questions[0]->id,
            'quiz_answer_id' => $correct[0]->id,
            'is_correct' => true,
        ]);

        $resumed = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts/start", [], $headers);
        $resumed->assertOk();
        $resumed->assertJsonPath('attempt.id', $attemptId);
        $resumed->assertJsonPath("answers.{$questions[0]->id}.is_correct", true);
        $resumed->assertJsonPath("answers.{$questions[0]->id}.selected_answer_id", $correct[0]->id);
    }

    public function test_checking_an_answer_with_someone_elses_attempt_id_is_silently_ignored(): void
    {
        ['quiz' => $quiz, 'questions' => $questions, 'correct' => $correct] = $this->makeQuizWithQuestions(1);

        $mine = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts/start", [], ['X-Guest-Token' => 'guest-owner']);
        $theirs = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts/start", [], ['X-Guest-Token' => 'guest-intruder']);

        $response = $this->postJson(
            "/api/v1/quizzes/{$quiz->id}/questions/{$questions[0]->id}/check",
            ['answer_id' => $correct[0]->id, 'attempt_id' => $mine->json('attempt.id')],
            ['X-Guest-Token' => 'guest-intruder'],
        );

        // Grading itself still works normally...
        $response->assertOk();
        $response->assertJsonPath('is_correct', true);
        // ...but nothing was written against an attempt that isn't theirs.
        $this->assertDatabaseMissing('quiz_attempt_answers', ['quiz_attempt_id' => $mine->json('attempt.id')]);
        $this->assertDatabaseMissing('quiz_attempt_answers', ['quiz_attempt_id' => $theirs->json('attempt.id')]);
    }

    public function test_submitting_with_an_attempt_id_closes_out_that_same_row_instead_of_creating_a_new_one(): void
    {
        ['quiz' => $quiz, 'questions' => $questions, 'correct' => $correct] = $this->makeQuizWithQuestions(2);
        $headers = ['X-Guest-Token' => 'guest-submit'];

        $start = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts/start", [], $headers);
        $attemptId = $start->json('attempt.id');

        $this->postJson(
            "/api/v1/quizzes/{$quiz->id}/questions/{$questions[0]->id}/check",
            ['answer_id' => $correct[0]->id, 'attempt_id' => $attemptId],
            $headers,
        );

        // Submit only repeats the second answer — the first should still count via what's already
        // persisted from the check call above.
        $submit = $this->postJson(
            "/api/v1/quizzes/{$quiz->id}/attempts",
            [
                'answers' => [
                    ['question_id' => $questions[1]->id, 'answer_id' => $correct[1]->id],
                ],
                'attempt_id' => $attemptId,
            ],
            $headers,
        );

        $submit->assertCreated();
        $submit->assertJsonPath('attempt.id', $attemptId);
        $submit->assertJsonPath('attempt.status', AttemptStatus::Completed->value);
        $submit->assertJsonPath('attempt.correct_count', 2);
        $submit->assertJsonPath('attempt.score', 100);

        $this->assertSame(1, QuizAttempt::query()->count());
        $this->assertDatabaseHas('quiz_attempts', [
            'id' => $attemptId,
            'status' => AttemptStatus::Completed->value,
        ]);
    }

    public function test_force_new_always_starts_a_fresh_attempt_even_when_one_is_resumable(): void
    {
        ['quiz' => $quiz] = $this->makeQuizWithQuestions(2);
        $headers = ['X-Guest-Token' => 'guest-restart'];

        $first = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts/start", [], $headers);
        $restarted = $this->postJson(
            "/api/v1/quizzes/{$quiz->id}/attempts/start",
            ['force_new' => true],
            $headers,
        );

        $restarted->assertOk();
        $this->assertNotSame($first->json('attempt.id'), $restarted->json('attempt.id'));
        $this->assertSame(2, QuizAttempt::query()->count());

        // The old one is still there (harmlessly orphaned), never resurfaces once a fresher one
        // exists for the same identity.
        $again = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts/start", [], $headers);
        $again->assertJsonPath('attempt.id', $restarted->json('attempt.id'));
    }

    public function test_a_stale_in_progress_attempt_is_not_resumed(): void
    {
        ['quiz' => $quiz] = $this->makeQuizWithQuestions(1);
        $headers = ['X-Guest-Token' => 'guest-stale'];

        $old = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts/start", [], $headers);
        QuizAttempt::query()->whereKey($old->json('attempt.id'))->update(['updated_at' => now()->subDays(8)]);

        $fresh = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts/start", [], $headers);

        $fresh->assertOk();
        $this->assertNotSame($old->json('attempt.id'), $fresh->json('attempt.id'));
    }

    public function test_authenticated_users_resume_by_user_id_regardless_of_guest_token(): void
    {
        ['quiz' => $quiz] = $this->makeQuizWithQuestions(2);
        $user = User::factory()->create();

        $first = $this->actingAs($user, 'sanctum')->postJson("/api/v1/quizzes/{$quiz->id}/attempts/start");
        $second = $this->actingAs($user, 'sanctum')->postJson(
            "/api/v1/quizzes/{$quiz->id}/attempts/start",
            [],
            ['X-Guest-Token' => 'irrelevant-once-logged-in'],
        );

        $this->assertSame($first->json('attempt.id'), $second->json('attempt.id'));
        $this->assertDatabaseHas('quiz_attempts', [
            'id' => $first->json('attempt.id'),
            'user_id' => $user->id,
            'guest_token' => null,
        ]);
    }

    public function test_quiz_listing_exposes_in_progress_summary_for_a_matching_identity_only(): void
    {
        ['quiz' => $quiz, 'questions' => $questions, 'correct' => $correct] = $this->makeQuizWithQuestions(4);
        $headers = ['X-Guest-Token' => 'guest-listing'];

        $start = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts/start", [], $headers);
        $this->postJson(
            "/api/v1/quizzes/{$quiz->id}/questions/{$questions[0]->id}/check",
            ['answer_id' => $correct[0]->id, 'attempt_id' => $start->json('attempt.id')],
            $headers,
        );

        $mine = $this->getJson("/api/v1/quizzes/{$quiz->id}", $headers);
        $mine->assertOk();
        $mine->assertJsonPath('quiz.in_progress.answered', 1);
        $mine->assertJsonPath('quiz.in_progress.total', 4);

        $someoneElse = $this->getJson("/api/v1/quizzes/{$quiz->id}", ['X-Guest-Token' => 'guest-nobody']);
        $someoneElse->assertOk();
        $someoneElse->assertJsonPath('quiz.in_progress', null);

        $noIdentity = $this->getJson("/api/v1/quizzes/{$quiz->id}");
        $noIdentity->assertOk();
        $noIdentity->assertJsonPath('quiz.in_progress', null);
    }
}
