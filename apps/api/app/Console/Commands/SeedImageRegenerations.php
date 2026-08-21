<?php

namespace App\Console\Commands;

use App\Enums\ImageRegenerationStatus;
use App\Models\QuizImageRegeneration;
use App\Models\QuizQuestion;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Builds the review queue: one `quiz_image_regenerations` row per UNIQUE quiz image, keyed by the
 * crawl `source_url` (~637 rows for ~37,823 media). Captures the representative media id, the usage
 * count (blast radius for the reviewer), and the distinct question texts that use the image — the
 * latter feeds the Ideogram prompt so the regenerated image keeps the exact meaning the questions
 * test (e.g. the specific road sign), which a purely-visual caption can lose.
 *
 *   php artisan content:seed-image-regenerations
 */
class SeedImageRegenerations extends Command
{
    protected $signature = 'content:seed-image-regenerations';

    protected $description = 'Create one regeneration row per unique quiz question image (by source_url).';

    public function handle(): int
    {
        // Group media by source_url: representative id, usage count, and the set of question ids.
        $groups = [];
        DB::table('media')
            ->where('model_type', QuizQuestion::class)
            ->where('collection_name', QuizQuestion::MEDIA_COLLECTION_IMAGES)
            ->orderBy('id')
            ->select('id', 'model_id', 'custom_properties')
            ->chunk(1000, function ($rows) use (&$groups): void {
                foreach ($rows as $row) {
                    $props = json_decode((string) $row->custom_properties, true);
                    $source = $props['source_url'] ?? null;
                    if (! is_string($source) || $source === '') {
                        continue;
                    }
                    if (! isset($groups[$source])) {
                        $groups[$source] = ['representative_media_id' => $row->id, 'usage_count' => 0, 'question_ids' => []];
                    }
                    $groups[$source]['usage_count']++;
                    $groups[$source]['question_ids'][$row->model_id] = true;
                }
            });

        $this->info(count($groups).' unique image(s) found.');

        // Preload question id -> text once, to build each image's context without N+1 queries.
        $questionText = QuizQuestion::query()->pluck('question_text', 'id');

        $created = 0;
        $updated = 0;
        foreach ($groups as $source => $info) {
            $context = $this->buildContext(array_keys($info['question_ids']), $questionText);

            $existing = QuizImageRegeneration::query()->where('source_url', $source)->first();
            if ($existing !== null) {
                // Refresh derived fields, but never disturb a decided/queued row's status/candidate.
                $existing->update([
                    'representative_media_id' => $info['representative_media_id'],
                    'usage_count' => $info['usage_count'],
                    'question_context' => $context,
                ]);
                $updated++;

                continue;
            }

            QuizImageRegeneration::query()->create([
                'source_url' => $source,
                'representative_media_id' => $info['representative_media_id'],
                'usage_count' => $info['usage_count'],
                'question_context' => $context,
                'status' => ImageRegenerationStatus::Pending,
            ]);
            $created++;
        }

        $this->info("Done. Created: {$created}, refreshed: {$updated}.");

        return self::SUCCESS;
    }

    /**
     * Distinct question texts for this image, capped so the prompt stays focused (all these questions
     * share the one image, so a handful captures the meaning).
     *
     * @param  list<int>  $questionIds
     * @param  Collection<int, string>  $questionText
     */
    private function buildContext(array $questionIds, Collection $questionText): ?string
    {
        $texts = collect($questionIds)
            ->map(fn ($id) => trim((string) ($questionText[$id] ?? '')))
            ->filter()
            ->unique()
            ->take(8)
            ->values();

        if ($texts->isEmpty()) {
            return null;
        }

        return Str::limit($texts->implode(' | '), 1500, '');
    }
}
