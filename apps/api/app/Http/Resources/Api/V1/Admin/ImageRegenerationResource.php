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
            'has_backup' => (bool) $this->backup_path,
            // Direct (signed) URLs for the candidate/backup so the browser loads them straight from
            // storage in parallel — far faster than streaming each image through the API. Null when the
            // disk can't sign (e.g. local dev); the UI then falls back to the guarded stream route.
            'candidate_url' => $this->signedUrl($this->candidate_disk, $this->candidate_path),
            'backup_url' => $this->signedUrl($media?->disk, $this->backup_path),
            'decided_at' => $this->decided_at,
        ];
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
