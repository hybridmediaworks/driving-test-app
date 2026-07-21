<?php

namespace Tests\Feature\Flashcard;

use App\Models\Flashcard;
use App\Models\QuizCategory;
use App\Models\State;
use App\Models\User;
use App\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FlashcardAdminCrudTest extends TestCase
{
    use RefreshDatabase;

    private function validPayload(): array
    {
        return [
            'quiz_category_id' => QuizCategory::factory()->create()->id,
            'state_id' => State::factory()->create()->id,
            'vehicle_type_id' => VehicleType::factory()->create()->id,
            'front_text' => 'Solid red octagon sign',
            'back_text' => 'Come to a complete stop.',
            'topic' => 'regulatory-signs',
            'sort_order' => 0,
            'is_premium' => true,
            'is_active' => true,
        ];
    }

    public function test_guest_cannot_access_the_admin_flashcards_endpoint(): void
    {
        $response = $this->getJson('/api/v1/admin/flashcards');

        $response->assertUnauthorized();
    }

    public function test_non_admin_user_cannot_access_the_admin_flashcards_endpoint(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/admin/flashcards');

        $response->assertForbidden();
    }

    public function test_admin_can_create_a_flashcard(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/flashcards', $this->validPayload());

        $response->assertCreated();
        $response->assertJsonPath('flashcard.front_text', 'Solid red octagon sign');
        $this->assertDatabaseHas('flashcards', ['front_text' => 'Solid red octagon sign']);
    }

    public function test_creating_a_flashcard_requires_front_and_back_text(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $payload = $this->validPayload();
        unset($payload['front_text'], $payload['back_text']);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/flashcards', $payload);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['front_text', 'back_text']);
    }

    public function test_category_state_and_vehicle_type_are_optional_on_a_flashcard(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $payload = $this->validPayload();
        unset($payload['quiz_category_id'], $payload['state_id'], $payload['vehicle_type_id']);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/flashcards', $payload);

        $response->assertCreated();
        $this->assertDatabaseHas('flashcards', [
            'front_text' => $payload['front_text'],
            'quiz_category_id' => null,
            'state_id' => null,
            'vehicle_type_id' => null,
        ]);
    }

    public function test_admin_can_update_a_flashcard(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $card = Flashcard::factory()->create();

        $payload = $this->validPayload();
        $payload['front_text'] = 'Updated front text';

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/flashcards/{$card->id}", [...$payload, '_method' => 'PUT']);

        $response->assertOk();
        $response->assertJsonPath('flashcard.front_text', 'Updated front text');
        $this->assertDatabaseHas('flashcards', ['id' => $card->id, 'front_text' => 'Updated front text']);
    }

    public function test_admin_can_delete_a_flashcard(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $card = Flashcard::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/flashcards/{$card->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('flashcards', ['id' => $card->id]);
    }

    public function test_deleting_a_flashcard_cascades_its_reviews(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();
        $card = Flashcard::factory()->create(['is_premium' => false]);
        $this->actingAs($user, 'sanctum')->postJson("/api/v1/flashcards/{$card->id}/review", ['status' => 'known']);

        $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/flashcards/{$card->id}")->assertOk();

        $this->assertDatabaseMissing('flashcard_reviews', ['flashcard_id' => $card->id]);
    }

    public function test_admin_index_returns_lookup_lists_for_the_form(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        QuizCategory::factory()->create();
        State::factory()->create();
        VehicleType::factory()->create(['is_active' => true]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/flashcards');

        $response->assertOk();
        $response->assertJsonStructure(['flashcards', 'categories', 'states', 'vehicle_types']);
    }
}
