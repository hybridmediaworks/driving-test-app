<?php

namespace App\Actions\Content;

use App\Actions\Quiz\GenerateUniqueSlug;
use App\Enums\HazardType;
use App\Models\Hazard;
use App\Models\HazardFrame;
use App\Models\HazardSimulator;
use App\Models\State;
use App\Models\VehicleType;
use App\Models\Video;
use App\Support\DurationParser;
use App\Support\ImportSummary;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

/**
 * Imports one simulators.json — hazard-perception exercises, Vimeo-embedded, Driving Test track
 * only. Each row has three layers (see docs/HAZARD_PERCEPTION_SIMULATOR.md §3):
 *
 *   1. Clip metadata      → the watchable Video (title/thumbnail/duration/premium/section).
 *   2. Hazard pool        → `hazards[]`: every tagged event, its window, category, narration.
 *   3. Scored sequence    → `timeline[]`: the subset that actually counts, in play order.
 *
 * This action imports all three: the Video as before, then the HazardSimulator + its full hazard
 * pool + which hazards are scored (`in_timeline` / `sort_order`). Idempotent — keyed by `video_id`
 * for the simulator and `(simulator, source_hazard_id)` for each hazard, so a re-run updates in
 * place and never touches attempt history. Source data-quality quirks are logged via
 * ImportSummary::warn and never fail the run. Pass `$skipHazards` (`--skip-hazards`) to import only
 * the flat Video and leave the interactive layer untouched.
 *
 * `sim_id` is NOT a safe dedup key across the catalog: the source reuses a small pool of generic
 * hazard-perception clips (~13 of them) across every state AND both vehicle types — e.g. sim_id
 * 2858 is "AL Defensive Driving Hazard Simulator 1" in the Alabama car crawl and also "AK …
 * Simulator 1" in Alaska, and again under Motorcycle for both. Matching on `sim_id` would collapse
 * every state's simulator onto one shared HazardSimulator row and repoint it to whichever
 * state/vehicle was imported last (see git history around 2026-09-03 for the incident). Each
 * state+vehicle combination gets its own Video (already deduped by state/vehicle/track/title) and
 * therefore its own HazardSimulator — `sim_id` is kept only for traceability back to the source.
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
        bool $skipHazards = false,
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
                    'subsection' => $row['subsection'] ?? null,
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

            $this->attachThumbnail($video, $row['vimeo_id'] ?? null, $title, $summary);

            if (! $skipHazards) {
                $this->importHazardLayer($video, $row, $summary);
            }
        }
    }

    /**
     * Upsert the HazardSimulator + its hazard pool + timeline flags for one crawl row. Everything
     * here is best-effort: a malformed hazard is logged and skipped, never fatal.
     */
    private function importHazardLayer(Video $video, array $row, ImportSummary $summary): void
    {
        $label = "\"{$video->title}\"";
        $simId = isset($row['sim_id']) ? (int) $row['sim_id'] : null;

        // video_id, not sim_id — see the class docblock. Video is already the correctly-deduped
        // per-state/vehicle catalog entity; hazard_simulators.video_id is 1:1 and unique on it.
        $simulator = HazardSimulator::query()->where('video_id', $video->id)->first();

        // Staff have taken over this simulator's hazard layer — the crawl leaves it completely
        // alone (fields, hazard rows, is_active, scoring_profile all stay as edited in admin), and
        // doesn't even bother re-validating the source it's about to ignore.
        if ($simulator !== null && $simulator->content_locked) {
            $summary->warn("Simulator {$label}: content locked by staff — hazard layer left untouched.");
            $summary->increment('hazard_simulators.locked_skipped');

            return;
        }

        $hazards = array_values(array_filter((array) ($row['hazards'] ?? []), 'is_array'));
        $timeline = array_values(array_filter((array) ($row['timeline'] ?? []), 'is_array'));

        $scoredCount = count($timeline);
        $declaredHazardCount = (int) ($row['hazard_count'] ?? 0);
        if ($declaredHazardCount > 0 && $declaredHazardCount !== $scoredCount) {
            $summary->warn("Simulator {$label}: hazard_count ({$declaredHazardCount}) disagrees with timeline length ({$scoredCount}) — scoring against {$scoredCount}.");
        }

        $demoRows = count(array_filter($hazards, fn ($h) => ($h['mode'] ?? null) === 'demo'));
        $declaredDemo = (int) ($row['demo_hazard_count'] ?? 0);
        if ($declaredDemo > 0 && $declaredDemo !== $demoRows) {
            $summary->warn("Simulator {$label}: demo_hazard_count ({$declaredDemo}) disagrees with mode=demo hazards ({$demoRows}).");
        }

        // source hazard id -> position in the scored timeline. Re-indexed 0..n so a timeline entry
        // that points at a missing hazard doesn't leave a gap in the persisted sort_order.
        $timelineOrder = [];
        $position = 0;
        foreach ($timeline as $entry) {
            $hid = $entry['hazard_id'] ?? null;
            if ($hid !== null) {
                $timelineOrder[(int) $hid] = $position++;
            }
        }

        $attributes = [
            'video_id' => $video->id,
            'sim_id' => $simId,
            'page_id' => isset($row['page_id']) ? (int) $row['page_id'] : null,
            'provider' => 'vimeo',
            'provider_video_id' => isset($row['vimeo_id']) ? (string) $row['vimeo_id'] : null,
            'test_level' => $row['test_level'] ?? null,
            'test_location' => $row['test_location'] ?? null,
            'test_number' => isset($row['test_number']) ? (string) $row['test_number'] : null,
            // Provisional — reconciled to the real persisted rows once hazards are upserted below.
            'hazard_count' => $scoredCount,
            'demo_hazard_count' => $demoRows,
            'scoring_profile' => 'standard',
            'is_active' => true,
        ];

        if ($simulator === null) {
            $attributes['slug'] = $this->generateUniqueSlug->__invoke('hazard_simulators', $video->title);
            $simulator = HazardSimulator::query()->create($attributes);
            $summary->increment('hazard_simulators.created');
        } else {
            $simulator->fill($attributes)->save();
            $summary->increment('hazard_simulators.updated');
        }

        $seenSourceIds = [];
        foreach ($hazards as $h) {
            $sourceId = isset($h['id']) ? (int) $h['id'] : null;
            if ($sourceId === null) {
                $summary->warn("Simulator {$label}: a hazard row has no id — skipped.");

                continue;
            }
            $seenSourceIds[] = $sourceId;

            $start = (float) ($h['time_start'] ?? 0);
            $end = (float) ($h['time_end'] ?? 0);
            if ($end <= $start) {
                $summary->warn("Simulator {$label} hazard #{$sourceId}: time_end ({$end}) is not after time_start ({$start}).");
            }

            $inTimeline = array_key_exists($sourceId, $timelineOrder);
            $mode = in_array($h['mode'] ?? null, ['demo', 'assessment'], true) ? $h['mode'] : 'assessment';

            $frames = array_values(array_filter((array) ($h['frames'] ?? []), 'is_array'));

            $hazard = $simulator->hazards()->updateOrCreate(
                ['source_hazard_id' => $sourceId],
                [
                    'type_raw' => $h['type'] ?? null,
                    'type' => HazardType::fromSource($h['type'] ?? null),
                    'hazard_group' => isset($h['group']) ? (int) $h['group'] : null,
                    'mode' => $mode,
                    'in_timeline' => $inTimeline,
                    'sort_order' => $inTimeline ? $timelineOrder[$sourceId] : null,
                    'time_start' => $start,
                    'time_end' => $end,
                    'frame_count' => (int) ($h['frame_count'] ?? 0),
                    // The first keyframe, so the static player highlights where the hazard
                    // actually appears instead of resolvedBox()'s category fallback zone. Still
                    // null when the crawl carries no geometry — then the fallback stands.
                    'box' => self::normalizeBox($frames[0] ?? null),
                    'comment' => $h['comment'] ?? null,
                    'audio_url' => $h['audio_url'] ?? null,
                ],
            );
            $summary->increment('hazards.upserted');

            $this->syncFrames($hazard, $frames, $summary);
        }

        // A hazard the timeline references but the pool never defines — import what exists, flag it.
        foreach (array_keys($timelineOrder) as $timelineHazardId) {
            if (! in_array($timelineHazardId, $seenSourceIds, true)) {
                $summary->warn("Simulator {$label}: timeline references hazard #{$timelineHazardId}, which is not in hazards[].");
            }
        }

        // Hazards that vanished from the source since a previous import — drop them so the pool
        // stays a faithful mirror. Attempt-event rows nullOnDelete rather than cascade, so history
        // survives. Skipped entirely when the row carried no hazards at all (a broken source row —
        // don't let it wipe a previously-good import). Staff-added hazards (no source_hazard_id) are
        // never swept — only crawl-sourced rows the crawl no longer lists.
        if ($seenSourceIds !== []) {
            $removed = $simulator->hazards()
                ->whereNotNull('source_hazard_id')
                ->whereNotIn('source_hazard_id', $seenSourceIds)
                ->delete();
            if ($removed > 0) {
                $summary->warn("Simulator {$label}: removed {$removed} hazard(s) no longer present in the source.");
            }
        }

        // Reconcile the cached counts against what actually landed — a timeline entry pointing at a
        // hazard the pool never defined can't be scored, so it must not inflate `hazard_count`.
        $simulator->syncHazardCounts();
    }

    /**
     * Unlike YouTube, Vimeo has no guessable static thumbnail URL — the real thumbnail is fetched
     * via Vimeo's own public oEmbed endpoint for the exact video id. A real network call, not a
     * fabricated image; failures are logged and skipped rather than blocking the import. Backfills
     * existing rows too (idempotent re-import), not just newly created ones.
     */
    /**
     * The moving outline, one row per keyframe. hazard_frames was defined for exactly this and
     * left empty because earlier crawls stated only a `frame_count`; the coordinates arrive now.
     * Replaced wholesale rather than upserted — a keyframe carries no source id, so its position
     * in the list is its only identity.
     *
     * @param  list<array<string, mixed>>  $frames
     */
    private function syncFrames(Hazard $hazard, array $frames, ImportSummary $summary): void
    {
        $hazard->frames()->delete();

        $now = now();
        $rows = [];
        foreach ($frames as $index => $frame) {
            $box = self::normalizeBox($frame);
            if ($box === null) {
                continue;
            }

            $rows[] = [
                'hazard_id' => $hazard->id,
                't' => (float) ($frame['time'] ?? 0),
                'box' => json_encode($box),
                'sort_order' => $index,
                'created_at' => $now,
                'updated_at' => $now,
            ];
            $summary->increment('hazard_frames.created');
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            HazardFrame::query()->insert($chunk);
        }
    }

    /**
     * One scraped keyframe -> the normalized box both `hazards.box` and `hazard_frames.box` store.
     * The source states the outline as percentages of the video frame (top/left/width/height);
     * the columns are 0-1 {x,y,w,h}.
     *
     * @param  array<string, mixed>|null  $frame
     * @return array{x: float, y: float, w: float, h: float}|null
     */
    private static function normalizeBox(?array $frame): ?array
    {
        if ($frame === null || ! isset($frame['left'], $frame['top'], $frame['width'], $frame['height'])) {
            return null;
        }

        return [
            'x' => round((float) $frame['left'] / 100, 5),
            'y' => round((float) $frame['top'] / 100, 5),
            'w' => round((float) $frame['width'] / 100, 5),
            'h' => round((float) $frame['height'] / 100, 5),
        ];
    }

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

    private function attachThumbnail(Video $video, ?string $vimeoId, string $title, ImportSummary $summary): void
    {
        if ($vimeoId === null || self::hasUsableThumbnail($video)) {
            return;
        }

        try {
            $thumbnailUrl = Http::timeout(10)
                ->get('https://vimeo.com/api/oembed.json', ['url' => "https://vimeo.com/{$vimeoId}"])
                ->throw()
                ->json('thumbnail_url');

            if ($thumbnailUrl) {
                $video->addMediaFromUrl($thumbnailUrl)->toMediaCollection(Video::MEDIA_COLLECTION_THUMBNAIL);
            }
        } catch (\Throwable $e) {
            $summary->warn("Could not fetch Vimeo thumbnail for \"{$title}\": {$e->getMessage()}");
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
