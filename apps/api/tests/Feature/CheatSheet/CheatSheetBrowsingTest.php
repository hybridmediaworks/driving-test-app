<?php

namespace Tests\Feature\CheatSheet;

use App\Models\CheatSheet;
use App\Models\CheatSheetSection;
use App\Models\Plan;
use App\Models\QuizCategory;
use App\Models\State;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheatSheetBrowsingTest extends TestCase
{
    use RefreshDatabase;

    private function makeActiveSubscriber(): User
    {
        Plan::query()->firstOrCreate(
            ['key' => 'monthly'],
            ['name' => 'Monthly', 'type' => 'recurring', 'billing_interval' => 'month', 'price_cents' => 7500, 'stripe_price_id' => 'price_monthly_cheatsheet_test'],
        );

        $user = User::factory()->create(['is_admin' => false]);

        Subscription::query()->create([
            'user_id' => $user->id,
            'type' => 'default',
            'stripe_id' => 'sub_'.uniqid(),
            'stripe_status' => 'active',
            'stripe_price' => 'price_monthly_cheatsheet_test',
            'quantity' => 1,
        ]);

        return $user;
    }

    public function test_guest_sees_the_teaser_but_not_sections_for_a_premium_sheet(): void
    {
        $sheet = CheatSheet::factory()->create(['is_premium' => true, 'is_active' => true]);
        CheatSheetSection::factory()->create(['cheat_sheet_id' => $sheet->id]);

        $response = $this->getJson("/api/v1/cheat-sheets/{$sheet->id}");

        $response->assertOk();
        $response->assertJsonPath('cheat_sheet.title', $sheet->title);
        $response->assertJsonPath('cheat_sheet.summary', $sheet->summary);
        $response->assertJsonPath('locked', true);
        $response->assertJsonPath('sections', null);
    }

    public function test_guest_sees_sections_for_a_free_sheet(): void
    {
        $sheet = CheatSheet::factory()->create(['is_premium' => false, 'is_active' => true]);
        $section = CheatSheetSection::factory()->create(['cheat_sheet_id' => $sheet->id, 'heading' => 'Right of way']);

        $response = $this->getJson("/api/v1/cheat-sheets/{$sheet->id}");

        $response->assertOk();
        $response->assertJsonPath('locked', false);
        $response->assertJsonPath('sections.0.heading', 'Right of way');
        $response->assertJsonPath('sections.0.body_markdown', $section->body_markdown);
    }

    public function test_admin_sees_sections_for_a_premium_sheet(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $sheet = CheatSheet::factory()->create(['is_premium' => true, 'is_active' => true]);
        CheatSheetSection::factory()->create(['cheat_sheet_id' => $sheet->id]);

        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/cheat-sheets/{$sheet->id}");

        $response->assertOk();
        $response->assertJsonPath('locked', false);
        $this->assertCount(1, $response->json('sections'));
    }

    public function test_active_subscriber_sees_sections_for_a_premium_sheet(): void
    {
        $subscriber = $this->makeActiveSubscriber();
        $sheet = CheatSheet::factory()->create(['is_premium' => true, 'is_active' => true]);
        CheatSheetSection::factory()->create(['cheat_sheet_id' => $sheet->id]);

        $response = $this->actingAs($subscriber, 'sanctum')->getJson("/api/v1/cheat-sheets/{$sheet->id}");

        $response->assertOk();
        $response->assertJsonPath('locked', false);
        $this->assertCount(1, $response->json('sections'));
    }

    public function test_inactive_sheet_returns_403_on_show(): void
    {
        $sheet = CheatSheet::factory()->create(['is_active' => false]);

        $response = $this->getJson("/api/v1/cheat-sheets/{$sheet->id}");

        $response->assertForbidden();
    }

    public function test_inactive_sheets_are_excluded_from_the_index(): void
    {
        CheatSheet::factory()->create(['is_active' => false]);

        $response = $this->getJson('/api/v1/cheat-sheets');

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }

    public function test_filtering_by_state_includes_universal_sheets_with_a_null_state(): void
    {
        $california = State::factory()->create(['code' => 'CA']);
        $texas = State::factory()->create(['code' => 'TX']);

        $universal = CheatSheet::factory()->create(['state_id' => null, 'is_active' => true]);
        $caOnly = CheatSheet::factory()->create(['state_id' => $california->id, 'is_active' => true]);
        $txOnly = CheatSheet::factory()->create(['state_id' => $texas->id, 'is_active' => true]);

        $response = $this->getJson('/api/v1/cheat-sheets?state=CA');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($universal->id));
        $this->assertTrue($ids->contains($caOnly->id));
        $this->assertFalse($ids->contains($txOnly->id));
    }

    public function test_filtering_by_category_narrows_results(): void
    {
        $roadSigns = QuizCategory::factory()->create(['name' => 'road-signs']);
        $trafficLaws = QuizCategory::factory()->create(['name' => 'traffic-laws']);

        $signSheet = CheatSheet::factory()->create(['quiz_category_id' => $roadSigns->id, 'is_active' => true]);
        CheatSheet::factory()->create(['quiz_category_id' => $trafficLaws->id, 'is_active' => true]);

        $response = $this->getJson('/api/v1/cheat-sheets?category=road-signs');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertEqualsCanonicalizing([$signSheet->id], $ids->all());
    }
}
