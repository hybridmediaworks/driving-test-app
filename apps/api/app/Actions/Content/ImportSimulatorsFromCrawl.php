<?php

namespace App\Actions\Content;

use App\Actions\Quiz\GenerateUniqueSlug;
use App\Models\State;
use App\Models\VehicleType;
use App\Models\Video;
use App\Support\DurationParser;
use App\Support\ImportSummary;

/**
 * Imports one simulators.json — hazard-perception exercises, Vimeo-embedded, Driving Test track
 * only. The real data is richer than a flat video (each simulator has a timestamped `hazards`
 * array with its own narrated `audio_url`, sequenced by a `timeline`) — this pass imports the
 * simulator as a real, watchable Video; the per-hazard interactive/narrated layer is real future
 * work, deliberately not half-built here. See docs/PHASE_3_CONTENT_PLATFORM.md item 5.
 */
class ImportSimulatorsFromCrawl
{
    public function __construct(
        private readonly GenerateUniqueSlug $generateUniqueSlug,
    ) {}

    public function __invoke(
        array $data,
        State $state,
        VehicleType $vehicleType,
        string $testTrack,
        ImportSummary $summary,
        bool $dryRun,
    ): void {
        foreach ($data['simulators'] ?? [] as $index => $row) {
            $title = trim((string) ($row['title'] ?? ''));
            $embedUrl = $row['vimeo_embed_url'] ?? $row['vimeo_url'] ?? null;

            if ($title === '' || $embedUrl === null) {
                $summary->warn("Skipped a simulator with no title/embed url ({$state->name}/{$vehicleType->name}).");

                continue;
            }

            if ($dryRun) {
                $summary->increment('videos.would_import');

                continue;
            }

            $slug = $this->generateUniqueSlug->__invoke('videos', "{$state->code} {$vehicleType->name} {$title}");

            $video = Video::query()->updateOrCreate(
                ['state_id' => $state->id, 'vehicle_type_id' => $vehicleType->id, 'test_track' => $testTrack, 'title' => $title],
                [
                    'slug' => $slug,
                    'section' => $row['section'] ?? null,
                    'description' => $this->describe($row),
                    'duration_seconds' => DurationParser::fromMinSecString($row['test_length'] ?? null),
                    'source_url' => $row['url'] ?? null,
                    'external_url' => $embedUrl,
                    'is_premium' => true,
                    'is_active' => true,
                    'order_no' => $index,
                ],
            );
            $summary->increment($video->wasRecentlyCreated ? 'videos.created' : 'videos.updated');
        }
    }

    private function describe(array $row): ?string
    {
        $parts = [];
        if (isset($row['hazard_count'])) {
            $parts[] = "{$row['hazard_count']} hazards to spot";
        }
        if (! empty($row['test_level'])) {
            $parts[] = "{$row['test_level']} difficulty";
        }
        if (! empty($row['test_location'])) {
            $parts[] = "Filmed in {$row['test_location']}";
        }

        return $parts === [] ? null : implode(' · ', $parts);
    }
}
