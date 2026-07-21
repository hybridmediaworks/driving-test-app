<?php

namespace Tests\Feature\Quiz;

use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizQuestion;
use App\Models\QuizType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExamSimulatorGradingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{quiz: Quiz, questions: list<QuizQuestion>, correct: list<QuizAnswer>, wrong: list<QuizAnswer>}
     */
    private function makeQuizWithQuestions(int $count, ?int $passingScorePercent): array
    {
        $quiz = Quiz::factory()->create([
            'is_active' => true,
            'passing_score_percent' => $passingScorePercent,
        ]);
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

    public function test_attempt_is_marked_passed_when_score_meets_the_threshold(): void
    {
        // 4 questions, 3 correct = 75% — threshold is exactly 75.
        ['quiz' => $quiz, 'questions' => $questions, 'correct' => $correct, 'wrong' => $wrong] = $this->makeQuizWithQuestions(4, 75);

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [
            'answers' => [
                ['question_id' => $questions[0]->id, 'answer_id' => $correct[0]->id],
                ['question_id' => $questions[1]->id, 'answer_id' => $correct[1]->id],
                ['question_id' => $questions[2]->id, 'answer_id' => $correct[2]->id],
                ['question_id' => $questions[3]->id, 'answer_id' => $wrong[3]->id],
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('attempt.score', 75);
        $response->assertJsonPath('attempt.passed', true);
        $this->assertDatabaseHas('quiz_attempts', ['quiz_id' => $quiz->id, 'score' => 75, 'passed' => true]);
    }

    public function test_attempt_is_marked_not_passed_when_score_is_below_the_threshold(): void
    {
        // 4 questions, 2 correct = 50% — threshold is 75, so this fails.
        ['quiz' => $quiz, 'questions' => $questions, 'correct' => $correct, 'wrong' => $wrong] = $this->makeQuizWithQuestions(4, 75);

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [
            'answers' => [
                ['question_id' => $questions[0]->id, 'answer_id' => $correct[0]->id],
                ['question_id' => $questions[1]->id, 'answer_id' => $correct[1]->id],
                ['question_id' => $questions[2]->id, 'answer_id' => $wrong[2]->id],
                ['question_id' => $questions[3]->id, 'answer_id' => $wrong[3]->id],
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('attempt.score', 50);
        $response->assertJsonPath('attempt.passed', false);
        $this->assertDatabaseHas('quiz_attempts', ['quiz_id' => $quiz->id, 'score' => 50, 'passed' => false]);
    }

    public function test_passed_is_null_when_the_quiz_has_no_passing_score_percent(): void
    {
        // A regular practice quiz — no pass/fail concept applies.
        ['quiz' => $quiz, 'questions' => $questions, 'correct' => $correct] = $this->makeQuizWithQuestions(1, null);

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/attempts", [
            'answers' => [
                ['question_id' => $questions[0]->id, 'answer_id' => $correct[0]->id],
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('attempt.passed', null);
        $this->assertDatabaseHas('quiz_attempts', ['quiz_id' => $quiz->id, 'passed' => null]);
    }

    public function test_public_quiz_index_can_be_filtered_to_exam_simulator_quizzes_only(): void
    {
        $finalType = QuizType::factory()->create(['name' => 'final']);
        $practiceType = QuizType::factory()->create(['name' => 'practice']);

        $exam = Quiz::factory()->create(['is_active' => true, 'quiz_type_id' => $finalType->id]);
        Quiz::factory()->create(['is_active' => true, 'quiz_type_id' => $practiceType->id]);

        $response = $this->getJson('/api/v1/quizzes?quiz_type=final');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertEqualsCanonicalizing([$exam->id], $ids->all());
    }
}
