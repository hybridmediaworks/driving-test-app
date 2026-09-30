<?php

namespace App\Actions\Content;

use App\Actions\Quiz\GenerateUniqueSlug;
use App\Models\State;
use App\Models\VehicleType;
use App\Models\Video;
use App\Support\DurationParser;
use App\Support\ImportSummary;
use Illuminate\Support\Facades\Storage;

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

            $key = ['state_id' => $state->id, 'vehicle_type_id' => $vehicleType->id, 'test_track' => $testTrack, 'title' => $title];

            // Keep the slug a video was first imported with. Generating one unconditionally meant
            // a re-import saw the row's own slug as "taken" and rewrote it to `...-1`, then
            // `...-2` — every re-run silently churned every public video URL. Same fix as
            // ImportQuizzesFromCrawl.
            $slug = Video::query()->where($key)->value('slug')
                ?? $this->generateUniqueSlug->__invoke('videos', "{$state->code} {$vehicleType->name} {$title}");

            $video = Video::query()->updateOrCreate(
                $key,
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
    /**
     * A thumbnail worth keeping — the media ROW alone isn't enough. Storage that is wiped (a
     * container rebuild, a cleared local disk) leaves the rows behind pointing at files that no
     * longer exist, and a re-import that only checked for a row skipped straight past them, so
     * every one of those videos kept rendering a broken image. Checking the file means a
     * re-import heals them; when it's there, nothing is re-downloaded.
     */
    private static function hasUsableThumbnail(Video $video): bool
    {
        $media = $video->getFirstMedia(Video::MEDIA_COLLECTION_THUMBNAIL);
        if ($media === null) {
            return false;
        }

        if (Storage::disk($media->disk)->exists($media->getPathRelativeToRoot())) {
            return true;
        }

        $media->delete();

        return false;
    }

    private function attachThumbnail(Video $video, ?string $youtubeId, string $title, ImportSummary $summary): void
    {
        if ($youtubeId === null || self::hasUsableThumbnail($video)) {
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
