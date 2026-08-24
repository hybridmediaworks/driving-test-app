<?php

namespace App\Actions\Quiz;

use App\Enums\ImageRegenerationStatus;
use App\Models\QuizImageRegeneration;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Approve a regenerated candidate: back up the current original, then replace the image for EVERY
 * media that shares this source image so all questions using it get the new one. Disk-agnostic via
 * the Storage abstraction — on the local disk these media were hardlinks; on S3 each is its own
 * object, so we write to each explicitly (the read/write never assumes a local filesystem path).
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

        $candidateBytes = Storage::disk($row->candidate_disk)->get($row->candidate_path);

        return DB::transaction(function () use ($row, $admin, $media, $candidateBytes): QuizImageRegeneration {
            // Back up the current original on the media's own disk (S3 in production) so it survives
            // redeploys — read it before overwriting.
            $backupPath = "quiz-image-backups/{$row->id}/".now()->format('Ymd_His').'-'.$media->file_name;
            Storage::disk($media->disk)->put(
                $backupPath,
                Storage::disk($media->disk)->get($media->getPathRelativeToRoot()),
            );

            // Replace the image for every media that uses this source image, on its own disk.
            foreach ($this->sharedMedia($row->source_url) as $item) {
                Storage::disk($item->disk)->put($item->getPathRelativeToRoot(), $candidateBytes);
            }

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

    /**
     * Every quiz-image media that shares this source URL (the questions the approval affects).
     *
     * @return Collection<int, Media>
     */
    private function sharedMedia(string $sourceUrl): Collection
    {
        return Media::query()
            ->where('model_type', QuizQuestion::class)
            ->where('collection_name', QuizQuestion::MEDIA_COLLECTION_IMAGES)
            ->where('custom_properties->source_url', $sourceUrl)
            ->get();
    }
}
