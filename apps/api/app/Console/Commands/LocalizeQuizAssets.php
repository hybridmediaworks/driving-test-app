<?php

namespace App\Console\Commands;

use App\Enums\QuizQuestionAssetType;
use App\Models\QuizQuestion;
use App\Models\QuizQuestionAsset;
use Illuminate\Console\Command;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Throwable;

/**
 * Backfills quiz question assets that currently live on the source site (driving-tests.org) into
 * local storage so the app is fully self-hosted:
 *
 *  - Photos: `image_urls` media rows already point at the local `public` disk, but the files were
 *    never materialised (empty storage). Each row's original source is on its `source_url` custom
 *    property. The same handful of images repeat across tens of thousands of rows, so we download
 *    each unique URL once and hardlink it into every media path (copy fallback) — ~130 MB instead
 *    of the ~8 GB a per-row copy would cost.
 *  - Lottie: `quiz_question_assets` rows are hot-linked via `external_url`. We download each unique
 *    animation into `public/quiz-lottie/` and point the rows at the local disk (external_url kept
 *    for provenance; the model's `url` accessor now prefers the local copy).
 *
 * Idempotent: already-materialised files are skipped unless `--force` is passed.
 *
 *   php artisan content:localize-quiz-assets --dry-run
 *   php artisan content:localize-quiz-assets
 *   php artisan content:localize-quiz-assets --only=lottie
 */
class LocalizeQuizAssets extends Command
{
    protected $signature = 'content:localize-quiz-assets
        {--only=photos,lottie : Comma-separated asset kinds to localize (photos,lottie)}
        {--force : Re-download and overwrite files that already exist locally}
        {--limit= : Cap how many photo media rows / lottie URLs to process (for testing)}
        {--dry-run : Report what would be downloaded without writing anything}';

    protected $description = 'Download external quiz question assets (photos + Lottie) into local storage.';

    /** driving-tests.org sits behind Cloudflare and 403s plain clients — a real browser UA + referer passes. */
    private const REQUEST_HEADERS = [
        'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Referer' => 'https://driving-tests.org/',
        'Accept' => 'image/avif,image/webp,image/apng,image/*,application/json,*/*;q=0.8',
        'Accept-Language' => 'en-US,en;q=0.9',
    ];

    /** source_url => absolute path of the first materialised copy (the hardlink target). */
    private array $photoCache = [];

    /** @var array<string,int> */
    private array $counts = [];

    /** @var list<string> */
    private array $warnings = [];

    public function handle(): int
    {
        $only = $this->csvOption('only') ?: ['photos', 'lottie'];
        $dryRun = (bool) $this->option('dry-run');
        $limit = $this->option('limit') !== null ? max(0, (int) $this->option('limit')) : null;

        if (in_array('photos', $only, true)) {
            $this->localizePhotos($dryRun, $limit);
        }

        if (in_array('lottie', $only, true)) {
            $this->localizeLottie($dryRun, $limit);
        }

        $this->report($dryRun);

        return self::SUCCESS;
    }

    private function localizePhotos(bool $dryRun, ?int $limit): void
    {
        $query = Media::query()
            ->where('model_type', QuizQuestion::class)
            ->where('collection_name', QuizQuestion::MEDIA_COLLECTION_IMAGES)
            ->orderBy('id');

        $total = $limit !== null ? min($limit, (clone $query)->count()) : (clone $query)->count();
        $this->info("Photos: {$total} media row(s) to check.");

        if ($total === 0) {
            return;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $processed = 0;
        $query->chunkById(500, function ($media) use ($dryRun, $limit, $bar, &$processed): bool {
            foreach ($media as $item) {
                if ($limit !== null && $processed >= $limit) {
                    return false;
                }
                $this->localizePhotoMedium($item, $dryRun);
                $processed++;
                $bar->advance();
            }

            return true;
        });

        $bar->finish();
        $this->newLine(2);
    }

    private function localizePhotoMedium(Media $media, bool $dryRun): void
    {
        $sourceUrl = $media->getCustomProperty('source_url');
        if (! is_string($sourceUrl) || $sourceUrl === '') {
            $this->increment('photos.no_source');
            $this->recordWarning("Media {$media->id} has no source_url — skipped.");

            return;
        }

        $target = $media->getPath();

        if (File::exists($target) && ! $this->option('force')) {
            // Adopt an already-present file as the canonical copy so its duplicates can hardlink to it.
            $this->photoCache[$sourceUrl] ??= $target;
            $this->increment('photos.skipped_present');

            return;
        }

        if ($dryRun) {
            $this->increment(isset($this->photoCache[$sourceUrl]) ? 'photos.would_link' : 'photos.would_download');
            $this->photoCache[$sourceUrl] ??= $target;

            return;
        }

        File::ensureDirectoryExists(dirname($target));

        // First time we see this URL: fetch the bytes into the target (this becomes the canonical
        // copy). Every later row with the same URL just hardlinks to it.
        if (! isset($this->photoCache[$sourceUrl])) {
            $response = $this->fetch($sourceUrl);
            if ($response === null) {
                $this->increment('photos.download_failed');

                return;
            }
            File::put($target, $response->body());
            $this->photoCache[$sourceUrl] = $target;
            $this->increment('photos.downloaded');

            return;
        }

        $this->materializeFrom($this->photoCache[$sourceUrl], $target, 'photos');
    }

    private function localizeLottie(bool $dryRun, ?int $limit): void
    {
        $urls = QuizQuestionAsset::query()
            ->where('type', QuizQuestionAssetType::Lottie)
            ->whereNotNull('external_url')
            ->distinct()
            ->orderBy('external_url')
            ->pluck('external_url');

        if ($limit !== null) {
            $urls = $urls->take($limit);
        }

        $this->info("Lottie: {$urls->count()} unique animation(s) to localize.");

        foreach ($urls as $url) {
            $relativePath = 'quiz-lottie/'.$this->safeBasename($url, 'json');
            $absolute = Storage::disk('public')->path($relativePath);

            $needsDownload = ! File::exists($absolute) || (bool) $this->option('force');

            if ($dryRun) {
                $this->increment($needsDownload ? 'lottie.would_download' : 'lottie.skipped_present');

                continue;
            }

            if ($needsDownload) {
                $response = $this->fetch($url);
                if ($response === null) {
                    $this->increment('lottie.download_failed');

                    continue;
                }
                File::ensureDirectoryExists(dirname($absolute));
                File::put($absolute, $response->body());
                $this->increment('lottie.downloaded');
            } else {
                $this->increment('lottie.skipped_present');
            }

            // Point every row for this URL at the local copy (external_url kept for provenance;
            // the url accessor now prefers disk+path). Cheap and idempotent.
            $updated = QuizQuestionAsset::query()
                ->where('type', QuizQuestionAssetType::Lottie)
                ->where('external_url', $url)
                ->update(['disk' => 'public', 'path' => $relativePath]);
            $this->increment('lottie.rows_pointed_local', $updated);
        }

        $this->newLine();
    }

    /** Hardlink $canonical -> $target, falling back to a copy across filesystems / on failure. */
    private function materializeFrom(string $canonical, string $target, string $group): void
    {
        if (File::exists($target)) {
            File::delete($target);
        }

        if (@link($canonical, $target)) {
            $this->increment("{$group}.hardlinked");

            return;
        }

        if (@copy($canonical, $target)) {
            $this->increment("{$group}.copied");

            return;
        }

        $this->increment("{$group}.link_failed");
        $this->recordWarning("Could not hardlink or copy {$canonical} -> {$target}.");
    }

    private function fetch(string $url): ?Response
    {
        try {
            $response = Http::withHeaders(self::REQUEST_HEADERS)
                ->retry(3, 1000, throw: false)
                ->timeout(20)
                ->get($url);

            if (! $response->successful()) {
                $this->recordWarning("Fetch failed ({$response->status()}): {$url}");

                return null;
            }

            return $response;
        } catch (Throwable $e) {
            $this->recordWarning("Fetch error for {$url}: {$e->getMessage()}");

            return null;
        }
    }

    private function safeBasename(string $url, string $fallbackExtension): string
    {
        $path = parse_url($url, PHP_URL_PATH) ?: '';
        $name = basename($path);

        if ($name === '' || ! Str::contains($name, '.')) {
            $name = 'asset-'.md5($url).'.'.$fallbackExtension;
        }

        // Guard against traversal / odd characters while keeping the original stem readable.
        return Str::of($name)->replaceMatches('/[^A-Za-z0-9._-]/', '_')->value();
    }

    private function increment(string $key, int $by = 1): void
    {
        $this->counts[$key] = ($this->counts[$key] ?? 0) + $by;
    }

    private function recordWarning(string $message): void
    {
        $this->warnings[] = $message;
        $this->warn($message);
    }

    /**
     * @return list<string>
     */
    private function csvOption(string $name): array
    {
        $value = $this->option($name);
        if (! is_string($value) || trim($value) === '') {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode(',', $value))));
    }

    private function report(bool $dryRun): void
    {
        $this->newLine();
        $this->info($dryRun ? '=== Dry run summary ===' : '=== Localize summary ===');

        ksort($this->counts);
        foreach ($this->counts as $key => $count) {
            $this->line("  {$key}: {$count}");
        }

        if ($this->warnings !== []) {
            $this->newLine();
            $this->comment(count($this->warnings).' warning(s) (first 20 shown):');
            foreach (array_slice($this->warnings, 0, 20) as $warning) {
                $this->line("  - {$warning}");
            }
        }
    }
}
