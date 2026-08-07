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
                    // Optional — only present once a crawl captures a two-level section (e.g.
                    // "Road Test Video Tips" -> "Common Mistakes to Avoid"). Absent today.
                    'subsection' => $row['subsection'] ?? null,
                    'description' => $this->renderDescription($row['content_sections'] ?? []),
                    // Prefer an explicit `duration` field when the row has one (e.g. "19m 21s") —
                    // older rows only embed it as a title suffix ("... 1:19 min"), still supported.
                    'duration_seconds' => DurationParser::fromMinSecString($row['duration'] ?? $title),
                    'source_url' => $row['url'] ?? null,
                    'external_url' => $embedUrl,
                    'is_premium' => false,
                    'is_active' => true,
                    'order_no' => $index,
                ],
            );
            $summary->increment($video->wasRecentlyCreated ? 'videos.created' : 'videos.updated');

            $this->attachThumbnail($video, $row['youtube_id'] ?? null, $title, $summary);
        }
    }

    /**
     * YouTube serves a real static thumbnail for any video id at a well-known, deterministic URL
     * — no API call needed, unlike Vimeo (see ImportSimulatorsFromCrawl). Backfills existing rows
     * too (idempotent re-import), not just newly created ones.
     */
    private function attachThumbnail(Video $video, ?string $youtubeId, string $title, ImportSummary $summary): void
    {
        if ($youtubeId === null || $video->getFirstMedia(Video::MEDIA_COLLECTION_THUMBNAIL) !== null) {
            return;
        }

        try {
            $video->addMediaFromUrl("https://img.youtube.com/vi/{$youtubeId}/hqdefault.jpg")
                ->toMediaCollection(Video::MEDIA_COLLECTION_THUMBNAIL);
        } catch (\Throwable $e) {
            $summary->warn("Could not fetch YouTube thumbnail for \"{$title}\": {$e->getMessage()}");
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
