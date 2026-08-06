<?php

namespace App\Actions\Content;

use App\Actions\Quiz\GenerateUniqueSlug;
use App\Models\CheatSheet;
use App\Models\State;
use App\Models\VehicleType;
use App\Support\ImportSummary;
use Illuminate\Support\Facades\File;
use Throwable;

/**
 * Imports one extra_support/*\/index.json's resources[] as real CheatSheet rows. Deliberately
 * ignores the JSON's own embedded absolute `path`/`folder` fields — those point at the original
 * scraper machine's filesystem, not wherever this import is actually reading from. Real file
 * locations are resolved from the folder this action is handed instead.
 */
class ImportExtraSupportFromCrawl
{
    public function __construct(
        private readonly GenerateUniqueSlug $generateUniqueSlug,
    ) {}

    public function __invoke(
        array $data,
        string $extraSupportFolderPath,
        State $state,
        VehicleType $vehicleType,
        ImportSummary $summary,
        bool $dryRun,
    ): void {
        foreach ($data['resources'] ?? [] as $index => $resource) {
            $title = trim((string) ($resource['title'] ?? ''));
            if ($title === '') {
                $summary->warn("Skipped an extra_support resource with no title ({$state->name}/{$vehicleType->name}).");

                continue;
            }

            $sourceStatus = $resource['files']['source']['status'] ?? null;
            if ($sourceStatus !== 'ok') {
                $summary->warn("Skipped extra_support resource \"{$title}\" — no downloadable file (source status: ".($sourceStatus ?? 'missing').") ({$state->name}/{$vehicleType->name}).");

                continue;
            }

            $resourceFolder = $extraSupportFolderPath.DIRECTORY_SEPARATOR.$title;
            if (! File::isDirectory($resourceFolder)) {
                $summary->warn("Expected folder not found for extra_support resource \"{$title}\": {$resourceFolder}");

                continue;
            }

            $pdfPath = collect(File::glob($resourceFolder.DIRECTORY_SEPARATOR.'*.pdf'))->first();
            if ($pdfPath === null) {
                $summary->warn("No local PDF found for extra_support resource \"{$title}\" in {$resourceFolder}.");

                continue;
            }

            if ($dryRun) {
                $summary->increment('cheat_sheets.would_import');

                continue;
            }

            $slug = $this->generateUniqueSlug->__invoke('cheat_sheets', "{$state->code} {$vehicleType->name} {$title}");

            $cheatSheet = CheatSheet::query()->updateOrCreate(
                ['state_id' => $state->id, 'vehicle_type_id' => $vehicleType->id, 'title' => $title],
                [
                    'slug' => $slug,
                    'summary' => "A downloadable {$vehicleType->title} study resource for {$state->name} learners.",
                    'is_premium' => true,
                    'is_active' => true,
                    'order_no' => $index,
                ],
            );
            $summary->increment($cheatSheet->wasRecentlyCreated ? 'cheat_sheets.created' : 'cheat_sheets.updated');

            try {
                $cheatSheet->addMedia($pdfPath)->preservingOriginal()->toMediaCollection(CheatSheet::MEDIA_COLLECTION_PDF);
                $summary->increment('cheat_sheet_pdfs.attached');
            } catch (Throwable $e) {
                $summary->warn("Cheat-sheet PDF attach failed for \"{$title}\": {$e->getMessage()}");
            }

            $coverPath = collect(File::glob($resourceFolder.DIRECTORY_SEPARATOR.'cover.*'))->first();
            if ($coverPath !== null) {
                try {
                    $cheatSheet->addMedia($coverPath)->preservingOriginal()->toMediaCollection(CheatSheet::MEDIA_COLLECTION_COVER);
                } catch (Throwable $e) {
                    $summary->warn("Cheat-sheet cover attach failed for \"{$title}\": {$e->getMessage()}");
                }
            }
        }
    }
}
