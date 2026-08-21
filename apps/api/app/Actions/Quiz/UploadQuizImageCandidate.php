<?php

namespace App\Actions\Quiz;

use App\Enums\ImageRegenerationStatus;
use App\Models\QuizImageRegeneration;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Spatie\Image\Enums\Fit;
use Spatie\Image\Image;

/**
 * Stage a designer-supplied image as the candidate for a row (an alternative to AI generation). It
 * is fit to the app's 1080x420 frame like the AI path, stored on the private disk, and the row moves
 * to awaiting_review so a reviewer can approve it exactly like a generated one.
 */
class UploadQuizImageCandidate
{
    private const WIDTH = 1080;

    private const HEIGHT = 420;

    public function __invoke(QuizImageRegeneration $row, UploadedFile $file): QuizImageRegeneration
    {
        $out = tempnam(sys_get_temp_dir(), 'upl_').'.jpg';
        Image::load($file->getRealPath())->fit(Fit::Crop, self::WIDTH, self::HEIGHT)->save($out);

        if ($row->candidate_disk && $row->candidate_path) {
            Storage::disk($row->candidate_disk)->delete($row->candidate_path);
        }

        $relativePath = "quiz-candidates/{$row->id}/".Str::uuid()->toString().'.jpg';
        Storage::disk('local')->put($relativePath, File::get($out));
        File::delete($out);

        $row->update([
            'prompt' => 'Manual designer upload',
            'candidate_disk' => 'local',
            'candidate_path' => $relativePath,
            'status' => ImageRegenerationStatus::AwaitingReview,
            'attempts' => $row->attempts + 1,
            'error' => null,
        ]);

        return $row->fresh();
    }
}
