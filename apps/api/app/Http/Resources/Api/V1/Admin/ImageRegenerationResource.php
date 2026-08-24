<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\QuizImageRegeneration;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * @mixin QuizImageRegeneration
 */
class ImageRegenerationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $media = $this->media();

        // A backup row can point at a file that no longer exists — anything approved before backups
        // moved to S3 was on wiped container storage. Verify existence so the UI shows a clean
        // "not available" instead of a broken image.
        $backupExists = $this->exists($media?->disk, $this->backup_path);

        return [
            'id' => $this->id,
            'status' => $this->status,
            'usage_count' => $this->usage_count,
            'prompt' => $this->prompt,
            'attempts' => $this->attempts,
            'error' => $this->error,
            // Live original — a direct (S3) URL the browser loads itself.
            'original_url' => $media?->getUrl(),
            'has_candidate' => (bool) ($this->candidate_disk && $this->candidate_path),
            'has_backup' => $backupExists,
            // Direct (signed) URLs for the candidate/backup so the browser loads them straight from
            // storage in parallel — far faster than streaming each image through the API. Null when the
            // disk can't sign (e.g. local dev); the UI then falls back to the guarded stream route.
            'candidate_url' => $this->signedUrl($this->candidate_disk, $this->candidate_path),
            'backup_url' => $backupExists ? $this->signedUrl($media?->disk, $this->backup_path) : null,
            'decided_at' => $this->decided_at,
        ];
    }

    private function exists(?string $disk, ?string $path): bool
    {
        if (! $disk || ! $path) {
            return false;
        }

        try {
            return Storage::disk($disk)->exists($path);
        } catch (Throwable) {
            return false;
        }
    }

    private function signedUrl(?string $disk, ?string $path): ?string
    {
        if (! $disk || ! $path) {
            return null;
        }

        try {
            return Storage::disk($disk)->temporaryUrl($path, now()->addHours(2));
        } catch (Throwable) {
            return null;
        }
    }
}
