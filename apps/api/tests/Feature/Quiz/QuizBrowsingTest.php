<?php

namespace Tests\Feature\Quiz;

use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizQuestion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizBrowsingTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_only_returns_active_quizzes(): void
    {
        Quiz::factory()->create(['is_active' => true, 'title' => 'Active Quiz']);
        Quiz::factory()->create(['is_active' => false, 'title' => 'Inactive Quiz']);

        $response = $this->getJson('/api/v1/quizzes');

        $response->assertOk();
        $titles = collect($response->json('data'))->pluck('title');
        $this->assertTrue($titles->contains('Active Quiz'));
        $this->assertFalse($titles->contains('Inactive Quiz'));
    }

    public function test_index_filters_by_state_vehicle_type_and_category(): void
    {
        $match = Quiz::factory()->create(['is_active' => true]);
        $match->state()->update(['code' => 'CA']);
        $match->vehicleType()->update(['name' => 'motorcycle']);
        $match->category()->update(['name' => 'road-signs']);

        Quiz::factory()->create(['is_active' => true]);

        $response = $this->getJson('/api/v1/quizzes?state=CA&vehicle_type=motorcycle&category=road-signs');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertEquals([$match->id], $ids->all());
    }

    public function test_show_returns_questions_but_never_leaks_correctness_or_explanation(): void
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create(['explanation' => 'Secret explanation']);
        QuizAnswer::factory()->for($question, 'quizQuestion')->correct()->create(['explanation' => 'Correct because...']);
        QuizAnswer::factory()->for($question, 'quizQuestion')->create();

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}");

        $response->assertOk();

        foreach ($response->json('questions') as $returnedQuestion) {
            $this->assertArrayNotHasKey('explanation', $returnedQuestion);
            foreach ($returnedQuestion['answers'] as $answer) {
                $this->assertArrayNotHasKey('is_correct', $answer);
                $this->assertArrayNotHasKey('explanation', $answer);
                $this->assertArrayHasKey('answer_text', $answer);
            }
        }
    }

    public function test_show_blocks_inactive_quiz(): void
    {
        $quiz = Quiz::factory()->create(['is_active' => false]);

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}");

        $response->assertForbidden();
    }
}
