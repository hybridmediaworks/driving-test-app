<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Quiz\ApproveImageRegeneration;
use App\Actions\Quiz\GenerateQuizImageCandidate;
use App\Actions\Quiz\RejectImageRegeneration;
use App\Actions\Quiz\UploadQuizImageCandidate;
use App\Enums\ImageRegenerationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\UploadImageCandidateRequest;
use App\Http\Resources\Api\V1\Admin\ImageRegenerationResource;
use App\Models\QuizImageRegeneration;
use App\Models\QuizQuestion;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ImageApprovalController extends Controller
{
    public function __construct(
        private readonly ApproveImageRegeneration $approve,
        private readonly RejectImageRegeneration $reject,
        private readonly GenerateQuizImageCandidate $generate,
        private readonly UploadQuizImageCandidate $upload,
    ) {}

    /**
     * List image regenerations. Defaults to the review queue (awaiting_review); pass ?status=all for
     * everything, or a specific status value.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = QuizImageRegeneration::query()->latest('id');

        $status = $request->string('status')->toString();
        if ($status === '') {
            $query->where('status', ImageRegenerationStatus::AwaitingReview->value);
        } elseif ($status !== 'all') {
            $query->where('status', $status);
        }

        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        return ImageRegenerationResource::collection($query->paginate($perPage)->withQueryString());
    }

    /**
     * Stream the staged candidate image (private disk, admin-only). Mirrors the public
     * QuizQuestionAssetController::content pattern but behind the admin middleware group.
     */
    public function candidate(QuizImageRegeneration $regeneration): StreamedResponse
    {
        abort_unless((bool) ($regeneration->candidate_disk && $regeneration->candidate_path), 404);

        $disk = Storage::disk($regeneration->candidate_disk);
        abort_unless($disk->exists($regeneration->candidate_path), 404);

        return $disk->response($regeneration->candidate_path);
    }

    /**
     * Stream the backed-up original (kept on approval). Lets the Approved view show the true
     * before/after, since the live original file has been overwritten by the approved image.
     */
    public function backup(QuizImageRegeneration $regeneration): StreamedResponse
    {
        abort_unless((bool) $regeneration->backup_path, 404);

        // Backups live on the media's own disk (S3 in production).
        $disk = Storage::disk($regeneration->media()?->disk ?? 'local');
        abort_unless($disk->exists($regeneration->backup_path), 404);

        return $disk->response($regeneration->backup_path);
    }

    public function approveDecision(QuizImageRegeneration $regeneration, Request $request): JsonResponse
    {
        $row = ($this->approve)($regeneration, $request->user());

        return response()->json(['image_regeneration' => new ImageRegenerationResource($row)]);
    }

    public function rejectDecision(QuizImageRegeneration $regeneration, Request $request): JsonResponse
    {
        $row = ($this->reject)($regeneration, $request->user());

        return response()->json(['image_regeneration' => new ImageRegenerationResource($row)]);
    }

    /**
     * On-demand AI generation for one row (the CLI does batches; this is the per-row button). Runs
     * synchronously — the caller shows a pending state. A generation failure comes back as a 422.
     */
    public function generate(QuizImageRegeneration $regeneration, Request $request): JsonResponse
    {
        // Generation calls out to Ideogram (and, for signs, the rembg mask helper) and can run well
        // past PHP's default 30s cap; lift it here (the HTTP client's own timeouts still bound it).
        @set_time_limit(0);

        // An optional reviewer prompt is appended to the base prompt (the base always runs) to fix a
        // specific problem in the picture on this re-roll.
        $customPrompt = trim($request->string('prompt')->toString()) ?: null;

        // Interactive re-rolls use TURBO so the request returns quickly and never hits a web timeout;
        // for inpaint the sign is preserved by the mask, so only the background is lighter. Bulk runs
        // via the CLI keep the config's QUALITY.
        $row = ($this->generate)($regeneration, 'TURBO', $customPrompt);

        if ($row->status === ImageRegenerationStatus::Failed) {
            return response()->json(['message' => $row->error ?? 'Generation failed.'], 422);
        }

        return response()->json(['image_regeneration' => new ImageRegenerationResource($row)]);
    }

    /**
     * Stage a designer-supplied image as the candidate instead of generating one.
     */
    public function upload(QuizImageRegeneration $regeneration, UploadImageCandidateRequest $request): JsonResponse
    {
        $row = ($this->upload)($regeneration, $request->file('image'));

        return response()->json(['image_regeneration' => new ImageRegenerationResource($row)]);
    }

    /**
     * The trash button. For an awaiting-review row: delete the staged candidate and reset to pending.
     * For an approved row: undo the approval — restore the backed-up original everywhere it's used and
     * reopen the row — so a fresh candidate can be generated.
     */
    public function discard(QuizImageRegeneration $regeneration): JsonResponse
    {
        $media = $regeneration->media();

        // If it was approved, undo the swap first: restore the backed-up original across every media
        // that shares this image, so the live picture goes back to the real original.
        if ($regeneration->status === ImageRegenerationStatus::Approved && $regeneration->backup_path
            && $media && Storage::disk($media->disk)->exists($regeneration->backup_path)) {
            $bytes = Storage::disk($media->disk)->get($regeneration->backup_path);
            foreach ($this->sharedMedia($regeneration->source_url) as $item) {
                Storage::disk($item->disk)->put($item->getPathRelativeToRoot(), $bytes);
            }
            Storage::disk($media->disk)->delete($regeneration->backup_path);
        }

        if ($regeneration->candidate_disk && $regeneration->candidate_path) {
            Storage::disk($regeneration->candidate_disk)->delete($regeneration->candidate_path);
        }

        $regeneration->update([
            'candidate_disk' => null,
            'candidate_path' => null,
            'backup_path' => null,
            'status' => ImageRegenerationStatus::Pending,
            'admin_user_id' => null,
            'decided_at' => null,
            'error' => null,
        ]);

        return response()->json(['image_regeneration' => new ImageRegenerationResource($regeneration->fresh())]);
    }

    /**
     * @return Collection<int, Media>
     */
    private function sharedMedia(string $sourceUrl)
    {
        return Media::query()
            ->where('model_type', QuizQuestion::class)
            ->where('collection_name', QuizQuestion::MEDIA_COLLECTION_IMAGES)
            ->where('custom_properties->source_url', $sourceUrl)
            ->get();
    }
}
