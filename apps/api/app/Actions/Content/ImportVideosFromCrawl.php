<?php

namespace App\Actions\Content;

use App\Actions\Quiz\GenerateUniqueSlug;
use App\Models\State;
use App\Models\VehicleType;
use App\Models\Video;
use App\Support\DurationParser;
use App\Support\ImportSummary;

/**
 * Imports one videos.json — instructional/road-test-commentary videos, YouTube-embedded. See
 * docs/PHASE_3_CONTENT_PLATFORM.md "Ingestion pipeline" item 5.
 */
class ImportVideosFromCrawl
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
        foreach ($data['videos'] ?? [] as $index => $row) {
            $title = trim((string) ($row['title'] ?? ''));
            $embedUrl = $row['youtube_url'] ?? null;

            if ($title === '' || $embedUrl === null) {
                $summary->warn("Skipped a video with no title/embed url ({$state->name}/{$vehicleType->name}).");

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
                    'description' => $this->renderDescription($row['content_sections'] ?? []),
                    'duration_seconds' => DurationParser::fromMinSecString($title),
                    'source_url' => $row['url'] ?? null,
                    'external_url' => $embedUrl,
                    'is_premium' => false,
                    'is_active' => true,
                    'order_no' => $index,
                ],
            );
            $summary->increment($video->wasRecentlyCreated ? 'videos.created' : 'videos.updated');
        }
    }

    /**
     * @param  list<array{heading?: string, items?: list<array{text?: string, positive?: bool}>}>  $contentSections
     */
    private function renderDescription(array $contentSections): ?string
    {
        if ($contentSections === []) {
            return null;
        }

        $lines = [];
        foreach ($contentSections as $section) {
            $heading = trim((string) ($section['heading'] ?? ''));
            if ($heading !== '') {
                $lines[] = "**{$heading}**";
            }
            foreach ($section['items'] ?? [] as $item) {
                $text = trim((string) ($item['text'] ?? ''));
                if ($text === '') {
                    continue;
                }
                $marker = ($item['positive'] ?? true) ? '✓' : '✗';
                $lines[] = "{$marker} {$text}";
            }
        }

        return $lines === [] ? null : implode("\n", $lines);
    }
}
