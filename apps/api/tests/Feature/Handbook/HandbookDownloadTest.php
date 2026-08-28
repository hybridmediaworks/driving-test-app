<?php

namespace Tests\Feature\Handbook;

use App\Models\Handbook;
use App\Models\State;
use App\Models\VehicleType;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class HandbookDownloadTest extends TestCase
{
    use RefreshDatabase;

    private function makeHandbook(): Handbook
    {
        $state = State::factory()->create();
        $vehicleType = VehicleType::factory()->create();

        return Handbook::query()->create([
            'state_id' => $state->id,
            'vehicle_type_id' => $vehicleType->id,
            'title' => 'Sample Driver Handbook',
        ]);
    }

    /**
     * A real, minimally-valid PDF with a genuine text layer — not a fake blob — so the
     * `text()` endpoint's real PDF-parsing code path is actually exercised, the same way
     * GenerateCheatSheetPdf produces real PDFs for cheat sheets.
     */
    private function attachRealPdf(Handbook $handbook, string $text): void
    {
        $pdf = Pdf::loadHTML("<p>{$text}</p>")->setPaper('letter');

        $handbook->addMediaFromString($pdf->output())
            ->usingFileName('handbook.pdf')
            ->toMediaCollection(Handbook::MEDIA_COLLECTION_PDF);
    }

    /**
     * A real multi-page PDF with genuine page breaks and bare "CHAPTER n" markers — mirrors the
     * exact structure verified against the real Alabama handbook (a Table-of-Contents-style
     * "Chapter n - Title" line for real titles, then a later page starting with a standalone
     * all-caps "CHAPTER n" marker for the real page boundary).
     */
    private function attachRealMultiChapterPdf(Handbook $handbook): void
    {
        $html = <<<'HTML'
            <div>Chapter 1 - First Chapter Title</div>
            <div>Chapter 2 - Second Chapter Title</div>
            <div style="page-break-before: always;">CHAPTER 1</div>
            <div>Content for the first real chapter about stopping at red lights.</div>
            <div style="page-break-before: always;">CHAPTER 2</div>
            <div>Content for the second real chapter about yielding to pedestrians.</div>
            HTML;

        $pdf = Pdf::loadHTML($html)->setPaper('letter');

        $handbook->addMediaFromString($pdf->output())
            ->usingFileName('handbook.pdf')
            ->toMediaCollection(Handbook::MEDIA_COLLECTION_PDF);
    }

    public function test_download_404s_when_no_pdf_is_attached(): void
    {
        $handbook = $this->makeHandbook();

        $response = $this->get("/api/v1/handbooks/{$handbook->id}/download");

        $response->assertNotFound();
    }

    public function test_download_returns_the_real_pdf_with_a_forced_attachment_disposition(): void
    {
        $handbook = $this->makeHandbook();
        $this->attachRealPdf($handbook, 'Real handbook content for download.');

        $response = $this->get("/api/v1/handbooks/{$handbook->id}/download");

        $response->assertOk();
        $this->assertStringContainsString('application/pdf', $response->headers->get('content-type'));
        $this->assertStringContainsString('attachment', $response->headers->get('content-disposition'));
        $this->assertStringContainsString('sample-driver-handbook.pdf', $response->headers->get('content-disposition'));
    }

    public function test_text_404s_when_no_pdf_is_attached(): void
    {
        $handbook = $this->makeHandbook();

        $response = $this->getJson("/api/v1/handbooks/{$handbook->id}/text");

        $response->assertNotFound();
    }

    public function test_text_extracts_the_real_text_from_the_pdfs_embedded_text_layer(): void
    {
        $handbook = $this->makeHandbook();
        $this->attachRealPdf($handbook, 'Always stop at a red light before turning.');

        $response = $this->getJson("/api/v1/handbooks/{$handbook->id}/text");

        $response->assertOk();
        $this->assertStringContainsString('Always stop at a red light before turning.', $response->json('text'));
    }

    public function test_text_is_cached_by_media_id_so_it_is_not_reparsed_on_every_request(): void
    {
        $handbook = $this->makeHandbook();
        $this->attachRealPdf($handbook, 'Cache me once, please.');
        $mediaId = $handbook->fresh()->getFirstMedia(Handbook::MEDIA_COLLECTION_PDF)->id;

        $this->assertFalse(Cache::has("handbook-parsed:{$mediaId}"));

        $this->getJson("/api/v1/handbooks/{$handbook->id}/text")->assertOk();

        $this->assertTrue(Cache::has("handbook-parsed:{$mediaId}"));
        $this->assertStringContainsString('Cache me once, please.', Cache::get("handbook-parsed:{$mediaId}")['text']);
    }

    public function test_text_returns_null_chapters_when_the_pdf_has_no_chapter_markers(): void
    {
        $handbook = $this->makeHandbook();
        $this->attachRealPdf($handbook, 'Just one plain page, no chapter structure at all.');

        $response = $this->getJson("/api/v1/handbooks/{$handbook->id}/text");

        $response->assertOk();
        $this->assertNull($response->json('chapters'));
    }

    public function test_text_detects_real_chapters_from_the_pdfs_own_pages(): void
    {
        $handbook = $this->makeHandbook();
        $this->attachRealMultiChapterPdf($handbook);

        $response = $this->getJson("/api/v1/handbooks/{$handbook->id}/text");

        $response->assertOk();
        $chapters = $response->json('chapters');
        $this->assertNotNull($chapters);
        $this->assertCount(2, $chapters);

        $this->assertSame(1, $chapters[0]['number']);
        $this->assertSame('First Chapter Title', $chapters[0]['title']);
        $this->assertSame(2, $chapters[0]['start_page']);
        $this->assertStringContainsString('stopping at red lights', $chapters[0]['text']);
        $this->assertStringNotContainsString('yielding to pedestrians', $chapters[0]['text']);

        $this->assertSame(2, $chapters[1]['number']);
        $this->assertSame('Second Chapter Title', $chapters[1]['title']);
        $this->assertSame(3, $chapters[1]['start_page']);
        $this->assertStringContainsString('yielding to pedestrians', $chapters[1]['text']);
    }
}
