<?php

namespace Tests\Feature\Admin;

use App\Models\Quiz;
use App\Models\QuizType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizTypeManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_list_quiz_types_via_admin_endpoint(): void
    {
        $response = $this->getJson('/api/v1/admin/quiz-types');

        $response->assertUnauthorized();
    }

    public function test_non_admin_cannot_list_quiz_types_via_admin_endpoint(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/admin/quiz-types');

        $response->assertForbidden();
    }

    public function test_admin_can_list_quiz_types_paginated(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        QuizType::factory()->count(3)->create();

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/quiz-types');

        $response->assertOk();
        $response->assertJsonStructure(['data', 'links', 'meta']);
        $this->assertCount(3, $response->json('data'));
    }

    public function test_admin_can_create_a_quiz_type(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/quiz-types', [
            'name' => 'diagnostic',
            'title' => 'Diagnostic Quick Check',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('quiz_types', ['name' => 'diagnostic', 'title' => 'Diagnostic Quick Check']);
    }

    public function test_admin_can_update_a_quiz_type(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $quizType = QuizType::factory()->create(['name' => 'practice', 'title' => 'Practice']);

        $response = $this->actingAs($admin, 'sanctum')->putJson("/api/v1/admin/quiz-types/{$quizType->id}", [
            'name' => 'practice',
            'title' => 'Practice Test',
        ]);

        $response->assertOk();
        $this->assertSame('Practice Test', $quizType->fresh()->title);
    }

    public function test_admin_can_delete_an_unreferenced_quiz_type(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $quizType = QuizType::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/quiz-types/{$quizType->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('quiz_types', ['id' => $quizType->id]);
    }

    public function test_admin_cannot_delete_a_quiz_type_with_quizzes(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $quizType = QuizType::factory()->create();
        Quiz::factory()->create(['quiz_type_id' => $quizType->id]);

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/quiz-types/{$quizType->id}");

        $response->assertStatus(422);
        $this->assertDatabaseHas('quiz_types', ['id' => $quizType->id]);
    }
}
