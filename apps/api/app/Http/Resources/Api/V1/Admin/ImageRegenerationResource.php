<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\QuizImageRegeneration;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin QuizImageRegeneration
 */
class ImageRegenerationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'usage_count' => $this->usage_count,
            'prompt' => $this->prompt,
            'attempts' => $this->attempts,
            'error' => $this->error,
            // Live original, already public via the /storage symlink.
            'original_url' => $this->media()?->getUrl(),
            // The candidate is on the private disk; the admin UI streams it through the guarded
            // candidate route, so we expose only whether one exists (fetch it by id when true).
            'has_candidate' => (bool) ($this->candidate_disk && $this->candidate_path),
            // After approval the live original is the approved image; the pre-approval original is
            // kept as a backup so the UI can still show a true before/after.
            'has_backup' => (bool) $this->backup_path,
            'decided_at' => $this->decided_at,
        ];
    }
}
