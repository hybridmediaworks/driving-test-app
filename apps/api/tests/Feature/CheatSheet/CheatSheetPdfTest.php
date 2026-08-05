<?php

namespace Tests\Feature\CheatSheet;

use App\Models\CheatSheet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheatSheetPdfTest extends TestCase
{
    use RefreshDatabase;

    private function makeSheetWithSections(bool $isPremium): CheatSheet
    {
        $sheet = CheatSheet::factory()->create(['is_premium' => $isPremium, 'is_active' => true]);
        $sheet->sections()->create(['heading' => 'Section one', 'body_markdown' => "- Point one\n- Point two", 'sort_order' => 0]);
        $sheet->sections()->create(['heading' => 'Section two', 'body_markdown' => 'Some prose content.', 'sort_order' => 1]);

        return $sheet;
    }

    public function test_guest_cannot_download_a_premium_sheet(): void
    {
        $sheet = $this->makeSheetWithSections(isPremium: true);

        $response = $this->get("/api/v1/cheat-sheets/{$sheet->id}/download");

        $response->assertForbidden();
    }

    public function test_guest_can_download_a_free_sheet(): void
    {
        $sheet = $this->makeSheetWithSections(isPremium: false);

        $response = $this->get("/api/v1/cheat-sheets/{$sheet->id}/download");

        $response->assertOk();
        $this->assertStringContainsString('application/pdf', $response->headers->get('content-type'));
        $this->assertSame(1, $sheet->fresh()->getMedia(CheatSheet::MEDIA_COLLECTION_PDF)->count());
    }

    public function test_admin_can_download_a_premium_sheet(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $sheet = $this->makeSheetWithSections(isPremium: true);

        $response = $this->actingAs($admin, 'sanctum')->get("/api/v1/cheat-sheets/{$sheet->id}/download");

        $response->assertOk();
    }

    public function test_the_pdf_is_cached_between_downloads_not_regenerated_every_time(): void
    {
        $sheet = $this->makeSheetWithSections(isPremium: false);

        $this->get("/api/v1/cheat-sheets/{$sheet->id}/download")->assertOk();
        $firstMediaId = $sheet->fresh()->getFirstMedia(CheatSheet::MEDIA_COLLECTION_PDF)->id;

        $this->get("/api/v1/cheat-sheets/{$sheet->id}/download")->assertOk();
        $secondMediaId = $sheet->fresh()->getFirstMedia(CheatSheet::MEDIA_COLLECTION_PDF)->id;

        $this->assertSame($firstMediaId, $secondMediaId);
    }

    public function test_editing_sections_clears_the_cached_pdf_so_the_next_download_regenerates(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $sheet = $this->makeSheetWithSections(isPremium: false);

        $this->get("/api/v1/cheat-sheets/{$sheet->id}/download")->assertOk();
        $firstMediaId = $sheet->fresh()->getFirstMedia(CheatSheet::MEDIA_COLLECTION_PDF)->id;

        $payload = [
            'title' => $sheet->title,
            'summary' => $sheet->summary,
            'order_no' => 0,
            'is_premium' => false,
            'is_active' => true,
            'sections' => [
                ['heading' => 'Rewritten section', 'body_markdown' => 'Different content entirely.'],
            ],
            '_method' => 'PUT',
        ];
        $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/cheat-sheets/{$sheet->id}", $payload)->assertOk();

        // The update itself must have cleared the cache — no cached file until the next download.
        $this->assertNull($sheet->fresh()->getFirstMedia(CheatSheet::MEDIA_COLLECTION_PDF));

        $this->get("/api/v1/cheat-sheets/{$sheet->id}/download")->assertOk();
        $secondMediaId = $sheet->fresh()->getFirstMedia(CheatSheet::MEDIA_COLLECTION_PDF)->id;

        $this->assertNotSame($firstMediaId, $secondMediaId);
    }
}
