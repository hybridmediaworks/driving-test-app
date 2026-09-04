<?php

namespace Tests\Feature;

use App\Enums\AttemptStatus;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use App\Models\QuizQuestion;
use App\Models\State;
use App\Models\User;
use App\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ProgressTest extends TestCase
{
    use RefreshDatabase;

    private function verifiedUser(): User
    {
        return User::factory()->create(['email_verified_at' => now()]);
    }

    /**
     * A quiz with `$questionCount` questions in the given state/vehicle/track.
     */
    private function quizWithQuestions(
        int $questionCount,
        ?State $state = null,
        ?VehicleType $vehicleType = null,
        string $track = 'permit_test',
    ): Quiz {
        $quiz = Quiz::factory()->create([
            'state_id' => ($state ?? State::factory()->create())->id,
            'vehicle_type_id' => ($vehicleType ?? VehicleType::factory()->create())->id,
            'test_track' => $track,
            'is_active' => true,
        ]);

        QuizQuestion::factory()->count($questionCount)->create(['quiz_id' => $quiz->id]);

        return $quiz;
    }

    /**
     * Records an attempt on `$quiz` answering its first `$answerCount` questions at `$answeredAt`.
     */
    private function attempt(
        User $user,
        Quiz $quiz,
        int $answerCount,
        AttemptStatus $status = AttemptStatus::Completed,
        ?Carbon $answeredAt = null,
    ): QuizAttempt {
        $attempt = QuizAttempt::create([
            'user_id' => $user->id,
            'quiz_id' => $quiz->id,
            'status' => $status,
            'total_questions' => $quiz->quizQuestions()->count(),
            'correct_count' => 0,
            'started_at' => $answeredAt ?? now(),
        ]);

        foreach ($quiz->quizQuestions()->take($answerCount)->get() as $question) {
            QuizAttemptAnswer::create([
                'quiz_attempt_id' => $attempt->id,
                'quiz_question_id' => $question->id,
                'is_correct' => true,
                'answered_at' => $answeredAt ?? now(),
            ]);
        }

        return $attempt;
    }

    public function test_progress_requires_authentication(): void
    {
        $this->getJson('/api/v1/me/progress')->assertUnauthorized();
    }

    public function test_it_counts_completed_tests_and_covered_questions(): void
    {
        $user = $this->verifiedUser();
        $state = State::factory()->create(['code' => 'AL']);
        $car = VehicleType::factory()->create(['name' => 'car']);

        $first = $this->quizWithQuestions(10, $state, $car);
        $this->quizWithQuestions(5, $state, $car);

        $this->attempt($user, $first, 4);

        $response = $this->actingAs($user)
            ->getJson('/api/v1/me/progress?state=AL&vehicle_type=car&test_track=permit_test');

        $response->assertOk();
        $response->assertJsonPath('tests.completed', 1);
        $response->assertJsonPath('tests.total', 2);
        $response->assertJsonPath('questions.covered', 4);
        $response->assertJsonPath('questions.total', 15);
    }

    public function test_it_reports_questions_covered_per_quiz(): void
    {
        $user = $this->verifiedUser();
        $state = State::factory()->create(['code' => 'AL']);
        $car = VehicleType::factory()->create(['name' => 'car']);

        $started = $this->quizWithQuestions(10, $state, $car);
        $untouched = $this->quizWithQuestions(8, $state, $car);

        $this->attempt($user, $started, 7);

        $response = $this->actingAs($user)->getJson('/api/v1/me/progress?state=AL&vehicle_type=car');

        $response->assertOk();
        $response->assertJsonPath("questions.by_quiz.{$started->slug}", 7);
        // A quiz never started simply isn't in the map — the client treats a missing key as zero.
        $response->assertJsonMissingPath("questions.by_quiz.{$untouched->slug}");
    }

    public function test_retaking_a_test_does_not_inflate_coverage(): void
    {
        $user = $this->verifiedUser();
        $state = State::factory()->create(['code' => 'AL']);
        $car = VehicleType::factory()->create(['name' => 'car']);
        $quiz = $this->quizWithQuestions(10, $state, $car);

        $this->attempt($user, $quiz, 6);
        $this->attempt($user, $quiz, 6);

        $response = $this->actingAs($user)->getJson('/api/v1/me/progress?state=AL&vehicle_type=car');

        // The same six questions, twice — six covered, and one test completed, not two.
        $response->assertJsonPath('questions.covered', 6);
        $response->assertJsonPath('tests.completed', 1);
    }

    public function test_an_unfinished_attempt_still_counts_the_questions_it_reached(): void
    {
        $user = $this->verifiedUser();
        $state = State::factory()->create(['code' => 'AL']);
        $car = VehicleType::factory()->create(['name' => 'car']);
        $quiz = $this->quizWithQuestions(10, $state, $car);

        $this->attempt($user, $quiz, 3, AttemptStatus::InProgress);

        $response = $this->actingAs($user)->getJson('/api/v1/me/progress?state=AL&vehicle_type=car');

        $response->assertJsonPath('questions.covered', 3);
        $response->assertJsonPath('tests.completed', 0);
    }

    public function test_scope_excludes_other_states_and_other_users(): void
    {
        $user = $this->verifiedUser();
        $other = $this->verifiedUser();
        $al = State::factory()->create(['code' => 'AL']);
        $ca = State::factory()->create(['code' => 'CA']);
        $car = VehicleType::factory()->create(['name' => 'car']);

        $alabama = $this->quizWithQuestions(4, $al, $car);
        $california = $this->quizWithQuestions(4, $ca, $car);

        $this->attempt($user, $california, 4);
        $this->attempt($other, $alabama, 4);

        $response = $this->actingAs($user)->getJson('/api/v1/me/progress?state=AL&vehicle_type=car');

        $response->assertJsonPath('tests.total', 1);
        $response->assertJsonPath('tests.completed', 0);
        $response->assertJsonPath('questions.covered', 0);
    }

    public function test_streak_counts_consecutive_days_that_hit_the_daily_target(): void
    {
        $user = $this->verifiedUser();
        $quiz = $this->quizWithQuestions(20);

        // 15 is the daily target: yesterday and the day before hit it, three days ago falls short.
        $this->attempt($user, $quiz, 15, AttemptStatus::Completed, Carbon::yesterday());
        $this->attempt($user, $quiz, 15, AttemptStatus::Completed, Carbon::today()->subDays(2));
        $this->attempt($user, $quiz, 5, AttemptStatus::Completed, Carbon::today()->subDays(3));

        $response = $this->actingAs($user)->getJson('/api/v1/me/progress');

        $response->assertOk();
        $response->assertJsonPath('streak.current', 2);
        $response->assertJsonPath('streak.daily_target', 15);
        $response->assertJsonPath('streak.answered_today', 0);
        $response->assertJsonCount(5, 'streak.days');
    }

    public function test_todays_unfinished_target_does_not_break_the_streak(): void
    {
        $user = $this->verifiedUser();
        $quiz = $this->quizWithQuestions(20);

        $this->attempt($user, $quiz, 15, AttemptStatus::Completed, Carbon::yesterday());
        // Today: some work done, but under the target.
        $this->attempt($user, $quiz, 2, AttemptStatus::InProgress, Carbon::today());

        $response = $this->actingAs($user)->getJson('/api/v1/me/progress');

        $response->assertJsonPath('streak.current', 1);
        $response->assertJsonPath('streak.answered_today', 2);
    }

    public function test_a_learner_with_no_attempts_gets_zeroes_not_an_error(): void
    {
        $user = $this->verifiedUser();
        $state = State::factory()->create(['code' => 'AL']);
        $car = VehicleType::factory()->create(['name' => 'car']);
        $this->quizWithQuestions(6, $state, $car);

        $response = $this->actingAs($user)->getJson('/api/v1/me/progress?state=AL&vehicle_type=car');

        $response->assertOk();
        $response->assertJsonPath('tests.completed', 0);
        $response->assertJsonPath('questions.covered', 0);
        $response->assertJsonPath('questions.total', 6);
        $response->assertJsonPath('streak.current', 0);
    }

    public function test_a_state_with_no_quizzes_reports_zero_totals(): void
    {
        $user = $this->verifiedUser();

        $response = $this->actingAs($user)->getJson('/api/v1/me/progress?state=ZZ&vehicle_type=car');

        $response->assertOk();
        $response->assertJsonPath('tests.total', 0);
        $response->assertJsonPath('questions.total', 0);
        $response->assertJsonPath('questions.covered', 0);
    }

    public function test_exam_date_can_be_set_read_back_and_cleared(): void
    {
        $user = $this->verifiedUser();

        $this->actingAs($user)
            ->putJson('/api/v1/me/exam-date', ['exam_date' => '2026-05-18'])
            ->assertOk()
            ->assertJsonPath('exam_date', '2026-05-18');

        $this->actingAs($user)->getJson('/api/v1/me')->assertJsonPath('user.exam_date', '2026-05-18');

        $this->actingAs($user)
            ->putJson('/api/v1/me/exam-date', ['exam_date' => null])
            ->assertOk()
            ->assertJsonPath('exam_date', null);

        $this->actingAs($user)->getJson('/api/v1/me')->assertJsonPath('user.exam_date', null);
    }

    public function test_exam_date_rejects_a_non_date(): void
    {
        $user = $this->verifiedUser();

        $this->actingAs($user)
            ->putJson('/api/v1/me/exam-date', ['exam_date' => 'next tuesday-ish'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('exam_date');
    }
}
