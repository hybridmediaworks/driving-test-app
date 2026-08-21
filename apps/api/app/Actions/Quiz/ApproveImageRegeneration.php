<?php

namespace App\Actions\Quiz;

use App\Enums\ImageRegenerationStatus;
use App\Models\QuizImageRegeneration;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * Approve a regenerated candidate: back the original bytes up to the private disk (independent
 * inode — a plain copy, never a hardlink), then overwrite the live file IN PLACE so every media
 * path hardlinked to that inode picks up the new image at once. Deleting/replacing the path would
 * break the hardlink group and only change one question, so we truncate-and-rewrite instead.
 */
class ApproveImageRegeneration
{
    public function __invoke(QuizImageRegeneration $row, User $admin): QuizImageRegeneration
    {
        if ($row->status !== ImageRegenerationStatus::AwaitingReview) {
            throw ValidationException::withMessages(['status' => __('This image is not awaiting review.')]);
        }

        if (! $row->candidate_disk || ! $row->candidate_path
            || ! Storage::disk($row->candidate_disk)->exists($row->candidate_path)) {
            throw ValidationException::withMessages(['candidate' => __('There is no candidate image to approve.')]);
        }

        $media = $row->media();
        if ($media === null) {
            throw ValidationException::withMessages(['media' => __('The original image is missing.')]);
        }

        return DB::transaction(function () use ($row, $admin, $media): QuizImageRegeneration {
            $livePath = $media->getPath();

            // Back up the current original first (read its bytes BEFORE overwriting).
            $backupPath = "quiz-image-backups/{$row->id}/".now()->format('Ymd_His').'-'.$media->file_name;
            Storage::disk('local')->put($backupPath, File::get($livePath));

            // Replace in place — truncates the shared inode, so all hardlinks update together.
            File::put($livePath, Storage::disk($row->candidate_disk)->get($row->candidate_path));

            // The staged candidate has served its purpose; drop it to reclaim space.
            Storage::disk($row->candidate_disk)->delete($row->candidate_path);

            $row->update([
                'status' => ImageRegenerationStatus::Approved,
                'admin_user_id' => $admin->id,
                'decided_at' => now(),
                'backup_path' => $backupPath,
                'candidate_path' => null,
            ]);

            return $row->fresh();
        });
    }
}
