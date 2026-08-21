<?php

namespace App\Console\Commands;

use App\Actions\Quiz\GenerateQuizImageCandidate;
use App\Enums\ImageRegenerationStatus;
use App\Models\QuizImageRegeneration;
use Illuminate\Console\Command;

/**
 * Generates AI candidates (Ideogram, describe -> generate) for queued images and stages them for
 * admin review. Run `content:seed-image-regenerations` first. Requires IDEOGRAM_API_KEY in the env.
 *
 *   php artisan content:regenerate-quiz-images --limit=8            # first sample
 *   php artisan content:regenerate-quiz-images                      # all pending
 *   php artisan content:regenerate-quiz-images --only=rejected      # re-do rejected after a review pass
 *   php artisan content:regenerate-quiz-images --limit=2 --speed=turbo    # try a speed without editing .env
 *   php artisan content:regenerate-quiz-images --ids=1,2 --speed=quality  # re-run the SAME images to compare
 */
class RegenerateQuizImages extends Command
{
    protected $signature = 'content:regenerate-quiz-images
        {--only=pending : Comma-separated statuses to (re)generate (pending,rejected,failed)}
        {--ids= : Comma-separated regeneration row ids to (re)generate, ignoring status}
        {--speed= : Override rendering speed for this run (turbo|default|quality)}
        {--limit= : Max rows to process this run}';

    protected $description = 'Generate AI candidate images (Ideogram) for queued quiz images.';

    public function handle(GenerateQuizImageCandidate $generate): int
    {
        if (! $this->applySpeedOverride()) {
            return self::FAILURE;
        }

        $ids = $this->idsOption();

        $query = QuizImageRegeneration::query()->orderBy('id');
        if ($ids !== []) {
            // Explicit ids re-generate those exact rows regardless of status (for A/B testing speeds).
            $query->whereIn('id', $ids);
            $scope = 'ids: '.implode(',', $ids);
        } else {
            $statuses = $this->statuses();
            $query->whereIn('status', $statuses);
            $scope = 'statuses: '.implode(',', $statuses);
        }

        $limit = $this->option('limit') !== null ? max(0, (int) $this->option('limit')) : null;
        if ($limit !== null) {
            $query->limit($limit);
        }

        $rows = $query->get();
        $speed = config('services.ideogram.rendering_speed');
        $this->info($rows->count()." image(s) to regenerate ({$scope}; speed: {$speed}).");
        if ($rows->isEmpty()) {
            return self::SUCCESS;
        }

        $bar = $this->output->createProgressBar($rows->count());
        $bar->start();

        $ok = 0;
        $failed = 0;
        foreach ($rows as $row) {
            $result = $generate($row);
            if ($result->status === ImageRegenerationStatus::AwaitingReview) {
                $ok++;
            } else {
                $failed++;
                $this->warn("  #{$row->id} failed: {$result->error}");
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Done. Awaiting review: {$ok}, failed: {$failed}.");

        return self::SUCCESS;
    }

    /** Apply the --speed override for this run only (never touches .env). Returns false if invalid. */
    private function applySpeedOverride(): bool
    {
        $speed = $this->option('speed');
        if ($speed === null || trim((string) $speed) === '') {
            return true;
        }

        $upper = strtoupper(trim((string) $speed));
        if (! in_array($upper, ['TURBO', 'DEFAULT', 'QUALITY'], true)) {
            $this->error("Invalid --speed '{$speed}'. Use one of: turbo, default, quality.");

            return false;
        }

        config(['services.ideogram.rendering_speed' => $upper]);

        return true;
    }

    /**
     * @return list<int>
     */
    private function idsOption(): array
    {
        $raw = trim((string) $this->option('ids'));
        if ($raw === '') {
            return [];
        }

        return array_values(array_filter(
            array_map('intval', array_map('trim', explode(',', $raw))),
            fn (int $n): bool => $n > 0,
        ));
    }

    /**
     * @return list<string>
     */
    private function statuses(): array
    {
        $valid = array_map(fn (ImageRegenerationStatus $s) => $s->value, ImageRegenerationStatus::cases());
        $requested = array_values(array_filter(array_map('trim', explode(',', (string) $this->option('only')))));
        $statuses = array_values(array_intersect($requested, $valid));

        return $statuses !== [] ? $statuses : [ImageRegenerationStatus::Pending->value];
    }
}
