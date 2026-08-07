<?php

namespace App\Actions\Content;

use App\Actions\Handbook\SyncHandbookChapters;
use App\Models\Handbook;
use App\Models\State;
use App\Models\VehicleType;
use App\Support\ImportSummary;
use Illuminate\Support\Str;
use Throwable;

/**
 * Imports one handbook/handbook.json + its local PDF. One handbook per state x vehicle_type x
 * language — confirmed against real data (Car/CDL/Motorcycle each have their own manual).
 */
class ImportHandbookFromCrawl
{
    public function __construct(
        private readonly SyncHandbookChapters $syncChapters,
    ) {}

    public function __invoke(
        array $data,
        ?string $pdfPath,
        State $state,
        VehicleType $vehicleType,
        ImportSummary $summary,
        bool $dryRun,
    ): void {
        $chapters = $data['chapters'] ?? [];
        if ($chapters === []) {
            $summary->warn("No handbook chapters found for {$state->name}/{$vehicleType->name} — skipped.");

            return;
        }

        if ($dryRun) {
            $summary->increment('handbooks.would_import');

            return;
        }

        $language = $data['language'] ?? 'english';

        $handbook = Handbook::query()->updateOrCreate(
            ['state_id' => $state->id, 'vehicle_type_id' => $vehicleType->id, 'language' => $language],
            [
                'title' => "{$state->name} {$vehicleType->title} Handbook",
                'source_url' => $data['source_url'] ?? null,
                'total_words' => $data['total_words'] ?? null,
            ],
        );
        $summary->increment($handbook->wasRecentlyCreated ? 'handbooks.created' : 'handbooks.updated');

        $formattedChapters = [];
        foreach ($chapters as $chapter) {
            $sections = [];
            foreach ($chapter['sections'] ?? [] as $section) {
                $content = trim((string) ($section['content'] ?? ''));
                if ($content === '') {
                    continue;
                }

                $heading = trim((string) ($section['heading'] ?? ''));
                // "More from {State}" is leftover scraped site-navigation text from the source
                // page (cross-links to other tests/handbooks), not real handbook content —
                // confirmed present, in this exact form, on every one of the imported handbooks.
                if (Str::startsWith(Str::lower($heading), 'more from ')) {
                    $summary->increment('handbook_sections.skipped_nav_junk');

                    continue;
                }

                $sections[] = ['heading' => $heading ?: null, 'content' => $content];
            }

            if ($sections !== []) {
                $formattedChapters[] = ['title' => $chapter['title'] ?? 'Untitled chapter', 'sections' => $sections];
            }
        }

        ($this->syncChapters)($handbook, $formattedChapters);
        $summary->increment('handbook_chapters.synced');

        if ($pdfPath !== null) {
            try {
                $handbook->addMedia($pdfPath)->preservingOriginal()->toMediaCollection(Handbook::MEDIA_COLLECTION_PDF);
                $summary->increment('handbook_pdfs.attached');
            } catch (Throwable $e) {
                $summary->warn("Handbook PDF attach failed for {$state->name}/{$vehicleType->name}: {$e->getMessage()}");
            }
        } else {
            $summary->warn("No local handbook PDF found for {$state->name}/{$vehicleType->name}.");
        }
    }
}
