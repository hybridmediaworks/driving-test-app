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
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
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

        $disk = Storage::disk('local');
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
     * Discard the current candidate (delete the staged file, reset to pending) so a fresh one can be
     * generated. Does not touch the live original or any approval.
     */
    public function discard(QuizImageRegeneration $regeneration): JsonResponse
    {
        if ($regeneration->candidate_disk && $regeneration->candidate_path) {
            Storage::disk($regeneration->candidate_disk)->delete($regeneration->candidate_path);
        }

        $regeneration->update([
            'candidate_disk' => null,
            'candidate_path' => null,
            'status' => ImageRegenerationStatus::Pending,
            'error' => null,
        ]);

        return response()->json(['image_regeneration' => new ImageRegenerationResource($regeneration->fresh())]);
    }
}
