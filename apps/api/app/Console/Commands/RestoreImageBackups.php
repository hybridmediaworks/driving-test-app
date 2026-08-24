<?php

namespace App\Console\Commands;

use App\Enums\ImageRegenerationStatus;
use App\Models\QuizImageRegeneration;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

/**
 * Re-download the ORIGINAL image (from its crawl source_url) and re-stage it as the backup for
 * approved rows whose backup file was lost — anything approved before backups moved to S3 was on
 * container-local storage and got wiped on redeploy. Restores the before/after view and revert.
 *
 *   php artisan content:restore-image-backups
 */
class RestoreImageBackups extends Command
{
    protected $signature = 'content:restore-image-backups {--force : Re-download even if a backup already exists}';

    protected $description = 'Re-download originals from source and restore missing backups for approved images.';

    /** driving-tests.org sits behind Cloudflare and 403s plain clients — a real browser UA + referer passes. */
    private const REQUEST_HEADERS = [
        'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Referer' => 'https://driving-tests.org/',
        'Accept' => 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    ];

    public function handle(): int
    {
        $rows = QuizImageRegeneration::query()
            ->where('status', ImageRegenerationStatus::Approved)
            ->orderBy('id')
            ->get();

        $this->info("{$rows->count()} approved image(s) to check.");

        $restored = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($rows as $row) {
            $media = $row->media();
            if ($media === null) {
                $this->warn("  #{$row->id}: representative media missing — skipped.");
                $failed++;

                continue;
            }

            if (! $this->option('force') && $row->backup_path && Storage::disk($media->disk)->exists($row->backup_path)) {
                $skipped++;

                continue;
            }

            if (! is_string($row->source_url) || $row->source_url === '') {
                $this->warn("  #{$row->id}: no source_url — skipped.");
                $failed++;

                continue;
            }

            try {
                $response = Http::withHeaders(self::REQUEST_HEADERS)->retry(3, 1000, throw: false)->timeout(30)->get($row->source_url);
                if (! $response->successful()) {
                    $this->warn("  #{$row->id}: source fetch failed ({$response->status()}).");
                    $failed++;

                    continue;
                }

                $path = "quiz-image-backups/{$row->id}/restored-".Str::uuid()->toString().'.jpg';
                Storage::disk($media->disk)->put($path, $response->body());
                $row->update(['backup_path' => $path]);
                $restored++;
            } catch (Throwable $e) {
                $this->warn("  #{$row->id}: {$e->getMessage()}");
                $failed++;
            }
        }

        $this->info("Done. Restored: {$restored}, already present: {$skipped}, failed: {$failed}.");

        return self::SUCCESS;
    }
}
