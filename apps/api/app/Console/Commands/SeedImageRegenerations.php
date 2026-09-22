<?php

namespace App\Console\Commands;

use App\Enums\ImageRegenerationStatus;
use App\Enums\QuizQuestionAssetType;
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

    /** How many question ids to keep per image — buildContext() renders at most 8 distinct texts. */
    private const CONTEXT_SAMPLE_SIZE = 25;

    public function handle(): int
    {
        // Group media by source_url: representative id, usage count, and the set of question ids.
        $groups = [];
        DB::table('media')
            ->join('quiz_questions', 'quiz_questions.id', '=', 'media.model_id')
            ->join('quizzes', 'quizzes.id', '=', 'quiz_questions.quiz_id')
            ->where('media.model_type', QuizQuestion::class)
            ->where('media.collection_name', QuizQuestion::MEDIA_COLLECTION_IMAGES)
            ->orderBy('media.id')
            ->select('media.id', 'media.model_id', 'media.custom_properties', 'quizzes.vehicle_type_id')
            ->chunk(1000, function ($rows) use (&$groups): void {
                foreach ($rows as $row) {
                    $props = json_decode((string) $row->custom_properties, true);
                    $source = $props['source_url'] ?? null;
                    if (! is_string($source) || $source === '') {
                        continue;
                    }
                    $this->accumulate($groups, $source, $row->model_id, (int) $row->vehicle_type_id, mediaId: $row->id);
                }
            });

        $this->info(count($groups).' unique media-backed image(s) found.');

        // Second pass: images stored as shared files behind `quiz_question_assets` rows (how the CDL
        // import stores them — one row per question, ~696 files behind ~96,771 rows). Keyed by the
        // same crawl URL, so an image used by both storage styles still collapses to one queue row.
        $assetGroups = [];
        DB::table('quiz_question_assets')
            ->join('quiz_questions', 'quiz_questions.id', '=', 'quiz_question_assets.quiz_question_id')
            ->join('quizzes', 'quizzes.id', '=', 'quiz_questions.quiz_id')
            ->where('quiz_question_assets.type', QuizQuestionAssetType::Image->value)
            ->whereNotNull('quiz_question_assets.external_url')
            ->orderBy('quiz_question_assets.id')
            ->select('quiz_question_assets.id', 'quiz_question_assets.quiz_question_id', 'quiz_question_assets.external_url', 'quizzes.vehicle_type_id')
            ->chunk(2000, function ($rows) use (&$assetGroups): void {
                foreach ($rows as $row) {
                    $this->accumulate($assetGroups, (string) $row->external_url, $row->quiz_question_id, (int) $row->vehicle_type_id, assetId: $row->id);
                }
            });

        $this->info(count($assetGroups).' unique asset-backed image(s) found.');

        foreach ($assetGroups as $source => $info) {
            if (isset($groups[$source])) {
                $groups[$source]['representative_asset_id'] = $info['representative_asset_id'];
                $groups[$source]['usage_count'] += $info['usage_count'];
                foreach ($info['vehicle_counts'] as $vehicleId => $count) {
                    $groups[$source]['vehicle_counts'][$vehicleId] = ($groups[$source]['vehicle_counts'][$vehicleId] ?? 0) + $count;
                }

                continue;
            }
            $groups[$source] = $info;
        }

        // Preload question id -> text for ONLY the sampled ids (see accumulate()'s cap). Plucking
        // every question's text used to work at 77k questions and blows a 128M memory_limit at the
        // 257k the CDL import brought — and buildContext never needed more than a handful anyway.
        $sampledIds = [];
        foreach ($groups as $info) {
            foreach (array_keys($info['question_ids']) as $id) {
                $sampledIds[$id] = true;
            }
        }
        $questionText = QuizQuestion::query()->whereKey(array_keys($sampledIds))->pluck('question_text', 'id');

        $created = 0;
        $updated = 0;
        foreach ($groups as $source => $info) {
            $questionIds = array_keys($info['question_ids']);
            $context = $this->buildContext($questionIds, $questionText);
            $vehicleTypeId = $this->resolveVehicle($info['vehicle_counts']);

            $existing = QuizImageRegeneration::query()->where('source_url', $source)->first();
            if ($existing !== null) {
                // Refresh derived fields, but never disturb a decided/queued row's status/candidate.
                $existing->update([
                    'representative_media_id' => $info['representative_media_id'],
                    'representative_asset_id' => $info['representative_asset_id'],
                    'vehicle_type_id' => $vehicleTypeId,
                    'usage_count' => $info['usage_count'],
                    'question_context' => $context,
                ]);
                $updated++;

                continue;
            }

            QuizImageRegeneration::query()->create([
                'source_url' => $source,
                'representative_media_id' => $info['representative_media_id'],
                'representative_asset_id' => $info['representative_asset_id'],
                'vehicle_type_id' => $vehicleTypeId,
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
     * Fold one media/asset row into its image's group: bump the usage count, tally the vehicle, and
     * keep a small sample of question ids.
     *
     * The sample is capped because buildContext() only ever renders 8 distinct texts — keeping every
     * id (and later every question's text) is what made this command need ~1GB once CDL landed.
     *
     * @param  array<string, array<string, mixed>>  $groups
     */
    private function accumulate(array &$groups, string $source, int $questionId, int $vehicleTypeId, ?int $mediaId = null, ?int $assetId = null): void
    {
        if (! isset($groups[$source])) {
            $groups[$source] = [
                'representative_media_id' => $mediaId,
                'representative_asset_id' => $assetId,
                'usage_count' => 0,
                'question_ids' => [],
                'vehicle_counts' => [],
            ];
        }

        $groups[$source]['usage_count']++;
        $groups[$source]['vehicle_counts'][$vehicleTypeId] = ($groups[$source]['vehicle_counts'][$vehicleTypeId] ?? 0) + 1;

        if (count($groups[$source]['question_ids']) < self::CONTEXT_SAMPLE_SIZE) {
            $groups[$source]['question_ids'][$questionId] = true;
        }
    }

    /**
     * The vehicle this image belongs to — the one most of its questions sit under. An image shared
     * across vehicles (the source reuses stock photos widely) gets the dominant one rather than a
     * null, so it still shows up in a filtered queue instead of disappearing from every view.
     *
     * @param  array<int, int>  $vehicleCounts
     */
    private function resolveVehicle(array $vehicleCounts): ?int
    {
        if ($vehicleCounts === []) {
            return null;
        }

        arsort($vehicleCounts);

        return (int) array_key_first($vehicleCounts);
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
