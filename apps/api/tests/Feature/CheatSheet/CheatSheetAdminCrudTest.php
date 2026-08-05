<?php

namespace Tests\Feature\CheatSheet;

use App\Models\CheatSheet;
use App\Models\QuizCategory;
use App\Models\State;
use App\Models\User;
use App\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheatSheetAdminCrudTest extends TestCase
{
    use RefreshDatabase;

    private function validPayload(): array
    {
        return [
            'quiz_category_id' => QuizCategory::factory()->create()->id,
            'state_id' => State::factory()->create()->id,
            'vehicle_type_id' => VehicleType::factory()->create()->id,
            'title' => 'Right-of-Way Quick Reference',
            'summary' => 'The rules that trip people up most.',
            'order_no' => 0,
            'is_premium' => true,
            'is_active' => true,
            'sections' => [
                ['heading' => 'Four-way stops', 'body_markdown' => 'First to stop goes first.'],
                ['heading' => 'Pedestrians', 'body_markdown' => 'Always yield in a crosswalk.'],
            ],
        ];
    }

    public function test_guest_cannot_access_the_admin_cheat_sheets_endpoint(): void
    {
        $response = $this->getJson('/api/v1/admin/cheat-sheets');

        $response->assertUnauthorized();
    }

    public function test_non_admin_user_cannot_access_the_admin_cheat_sheets_endpoint(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/admin/cheat-sheets');

        $response->assertForbidden();
    }

    public function test_admin_can_create_a_cheat_sheet_with_sections(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/cheat-sheets', $this->validPayload());

        $response->assertCreated();
        $response->assertJsonPath('cheat_sheet.title', 'Right-of-Way Quick Reference');
        $response->assertJsonPath('cheat_sheet.slug', 'right-of-way-quick-reference');
        $this->assertCount(2, $response->json('cheat_sheet.sections'));
        $this->assertDatabaseHas('cheat_sheets', ['title' => 'Right-of-Way Quick Reference']);
        $this->assertDatabaseHas('cheat_sheet_sections', ['heading' => 'Four-way stops']);
    }

    public function test_creating_a_cheat_sheet_requires_at_least_one_section(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $payload = $this->validPayload();
        $payload['sections'] = [];

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/cheat-sheets', $payload);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['sections']);
    }

    public function test_creating_a_cheat_sheet_requires_title_and_summary(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $payload = $this->validPayload();
        unset($payload['title'], $payload['summary']);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/cheat-sheets', $payload);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['title', 'summary']);
    }

    public function test_category_state_and_vehicle_type_are_optional(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $payload = $this->validPayload();
        unset($payload['quiz_category_id'], $payload['state_id'], $payload['vehicle_type_id']);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/cheat-sheets', $payload);

        $response->assertCreated();
        $this->assertDatabaseHas('cheat_sheets', [
            'title' => $payload['title'],
            'quiz_category_id' => null,
            'state_id' => null,
            'vehicle_type_id' => null,
        ]);
    }

    public function test_admin_can_update_a_cheat_sheet_and_sections_are_fully_replaced(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $sheet = CheatSheet::factory()->create();
        $sheet->sections()->create(['heading' => 'Old section', 'body_markdown' => 'Old content', 'sort_order' => 0]);

        $payload = $this->validPayload();
        $payload['title'] = 'Updated title';
        $payload['sections'] = [
            ['heading' => 'New section', 'body_markdown' => 'New content'],
        ];

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/cheat-sheets/{$sheet->id}", [...$payload, '_method' => 'PUT']);

        $response->assertOk();
        $response->assertJsonPath('cheat_sheet.title', 'Updated title');
        $this->assertCount(1, $response->json('cheat_sheet.sections'));
        $this->assertDatabaseMissing('cheat_sheet_sections', ['heading' => 'Old section']);
        $this->assertDatabaseHas('cheat_sheet_sections', ['heading' => 'New section']);
    }

    public function test_admin_can_delete_a_cheat_sheet(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $sheet = CheatSheet::factory()->create();
        $sheet->sections()->create(['heading' => 'A section', 'body_markdown' => 'Content', 'sort_order' => 0]);

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/cheat-sheets/{$sheet->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('cheat_sheets', ['id' => $sheet->id]);
        $this->assertDatabaseMissing('cheat_sheet_sections', ['cheat_sheet_id' => $sheet->id]);
    }

    public function test_admin_index_returns_lookup_lists_for_the_form(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        QuizCategory::factory()->create();
        State::factory()->create();
        VehicleType::factory()->create(['is_active' => true]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/cheat-sheets');

        $response->assertOk();
        $response->assertJsonStructure(['cheat_sheets', 'categories', 'states', 'vehicle_types']);
    }
}
