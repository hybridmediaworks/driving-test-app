<?php

namespace App\Actions\Quiz;

use App\Enums\ImageRegenerationStatus;
use App\Models\QuizImageRegeneration;
use App\Services\Ideogram\IdeogramClient;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Spatie\Image\Enums\Fit;
use Spatie\Image\Image;
use Throwable;

/**
 * Produces one AI-regenerated candidate for a unique quiz image using Describe -> Generate (no
 * source pixels reused, so no copyright carry-over): caption the live original, generate a fresh
 * image from that caption, crop it to the app's 1080x420 frame, and stage it on the private disk
 * for admin review. Failures are recorded on the row rather than thrown, so a batch keeps going.
 */
class GenerateQuizImageCandidate
{
    private const WIDTH = 1080;

    private const HEIGHT = 420;

    public function __construct(private readonly IdeogramClient $ideogram) {}

    /**
     * @param  string|null  $speedOverride  Force a rendering speed for this call only (e.g. the admin
     *                                      "Generate" button uses TURBO so the request finishes well
     *                                      inside web timeouts — for inpaint the sign is preserved by
     *                                      the mask regardless of speed, so only the background is
     *                                      faster/lighter). The CLI passes null and keeps config speeds.
     */
    public function __invoke(QuizImageRegeneration $row, ?string $speedOverride = null, ?string $customPrompt = null): QuizImageRegeneration
    {
        if ($speedOverride !== null && $speedOverride !== '') {
            config([
                'services.ideogram.rendering_speed' => $speedOverride,
                'services.ideogram.remix_rendering_speed' => $speedOverride,
            ]);
        }

        $media = $row->media();
        if ($media === null) {
            $row->update([
                'status' => ImageRegenerationStatus::Failed,
                'error' => 'Representative media row is missing.',
                'attempts' => $row->attempts + 1,
            ]);

            return $row->fresh();
        }

        $tmp = null;
        $maskPath = null;
        $originalTmp = null;
        try {
            // Pull the original into a local temp file first, so the rest works whether media lives on
            // the local disk or a remote one like S3 — `$media->getPath()` is only a real filesystem
            // path for local disks; on S3 it is just the object key and reading it locally fails.
            $originalTmp = tempnam(sys_get_temp_dir(), 'orig_').'.jpg';
            File::put($originalTmp, Storage::disk($media->disk)->get($media->getPathRelativeToRoot()));

            // Sign/symbol images are inpainted (Edit): the sign is masked and kept EXACTLY while only
            // the background is regenerated to a fresh setting — so the pictogram never drifts yet the
            // scene can be anywhere. Everything else uses the copyright-safest Describe -> Generate path.
            // Decide sign vs scene. The question wording usually says "sign", but not always — so if it
            // doesn't, describe the image and detect a sign from the caption too (a dedicated road sign
            // must go through inpaint, otherwise the scene path reinvents its symbol and breaks it).
            $caption = null;
            $isSign = $this->looksLikeSign($row->question_context);
            if (! $isSign) {
                $caption = $this->ideogram->describe($originalTmp);
                $isSign = $this->captionLooksLikeSign($caption);
            }

            if ($isSign) {
                // Sign: mask the sign (kept exactly) and regenerate only the background.
                $maskPath = $this->buildSignMask($originalTmp);
                $prompt = $this->appendCustom($this->buildBackgroundPrompt($row->id), $customPrompt);
                $imageUrl = $this->ideogram->edit($originalTmp, $maskPath, $prompt);
            } else {
                // Scene: Remix keeps the ACTUAL scene (same vehicles, riders, positions, arrows/labels)
                // and just re-renders it cleanly — text-to-image reinvents it and drops/adds vehicles.
                $prompt = $this->appendCustom($this->buildScenePrompt(), $customPrompt);
                $imageUrl = $this->ideogram->remix($originalTmp, $prompt);
            }

            $bytes = Http::timeout(60)->get($imageUrl)->throw()->body();

            $tmp = tempnam(sys_get_temp_dir(), 'ideo_').'.jpg';
            File::put($tmp, $bytes);
            Image::load($tmp)->fit(Fit::Crop, self::WIDTH, self::HEIGHT)->save($tmp);

            // Drop any previous candidate before staging the new one.
            if ($row->candidate_disk && $row->candidate_path) {
                Storage::disk($row->candidate_disk)->delete($row->candidate_path);
            }

            // Stage on the media's own disk (S3 in production) so it survives container redeploys —
            // container-local storage is wiped on every recreate.
            $relativePath = "quiz-candidates/{$row->id}/".Str::uuid()->toString().'.jpg';
            Storage::disk($media->disk)->put($relativePath, File::get($tmp));

            $row->update([
                'prompt' => $prompt,
                'candidate_disk' => $media->disk,
                'candidate_path' => $relativePath,
                'status' => ImageRegenerationStatus::AwaitingReview,
                'attempts' => $row->attempts + 1,
                'error' => null,
            ]);
        } catch (Throwable $e) {
            $row->update([
                'status' => ImageRegenerationStatus::Failed,
                'error' => Str::limit($e->getMessage(), 1000),
                'attempts' => $row->attempts + 1,
            ]);
        } finally {
            foreach ([$tmp, $maskPath, $originalTmp] as $path) {
                if ($path !== null && File::exists($path)) {
                    File::delete($path);
                }
            }
        }

        return $row->fresh();
    }

    /**
     * Scene prompt for the Remix path. Remix is fed the original image, so it already sees the exact
     * vehicles/riders/positions — the prompt just tells it to re-render cleanly and keep everything as
     * is (do not add or drop vehicles/people, do not invent signs or text), and drop the watermark.
     */
    private function buildScenePrompt(): string
    {
        return 'Re-render this exact US road/traffic scene as a clean, professional, photorealistic '
            .'image. Reproduce ONLY the vehicles that are actually in the reference — the SAME count, '
            .'types, colours, positions and directions. Do NOT add or clone any extra vehicle, '
            .'motorcycle, or bicycle, and do NOT remove or move any. Every vehicle must face and travel '
            .'in the SAME direction as in the reference — never reverse, flip, mirror, or turn one '
            .'around. IMPORTANT: keep any letter labels on the vehicles (such as A, B, C, D) EXACTLY as '
            .'they are — the same letter on the same vehicle in the same position — never remove, move, '
            .'relabel, or add extra labels. Keep any coloured arrows or path lines exactly as they are. '
            .'Remove any watermark or logo. Do not add any OTHER text, captions, road signs, or '
            .'gibberish beyond those existing vehicle labels. Realistic lighting.';
    }

    /**
     * Append an admin's runtime custom instruction to the base prompt (keeps the safety constraints
     * while letting a reviewer steer a re-roll, e.g. "keep the motorcycle facing right, no extra cars").
     */
    private function appendCustom(string $base, ?string $custom): string
    {
        $custom = trim((string) $custom);

        return $custom === '' ? $base : $base.' Additional instructions from the reviewer (follow these): '.$custom;
    }

    /**
     * Detect a dedicated road sign from the visual caption (used when the question wording didn't
     * already flag it). Matched conservatively so ordinary traffic scenes that merely mention a
     * "stop sign" in passing are not misrouted to the sign/inpaint path.
     */
    private function captionLooksLikeSign(?string $caption): bool
    {
        $c = Str::lower((string) $caption);

        foreach (['road sign', 'warning sign', 'traffic sign', 'yield sign', 'diamond sign', 'sign post', 'sign showing', 'sign depicting', 'sign with a'] as $needle) {
            if (str_contains($c, $needle)) {
                return true;
            }
        }

        return false;
    }

    /**
     * A sign/symbol image (routed to Remix). The question wording almost always says "sign" for these
     * ("what does this sign mean?"), which is exactly the case where the exact pictogram must survive.
     */
    private function looksLikeSign(?string $questionContext): bool
    {
        return str_contains(Str::lower((string) $questionContext), 'sign');
    }

    /** A pool of plausible US road settings, so each inpainted sign lands in a visibly different place. */
    private const BACKGROUND_SETTINGS = [
        'a quiet rural highway through open farmland at midday, distant low hills, clear sky',
        'a country road winding through green rolling hills and scattered trees on an overcast morning',
        'a desert highway crossing open scrubland with distant mesas and cacti under a bright blue sky',
        'a suburban residential street lined with houses and leafy trees in warm afternoon light',
        'a coastal road with the ocean, dunes and beach grass in the distance at golden hour',
        'a mountain road with pine forest and snow-capped peaks in the background',
        'a two-lane road through autumn woodland with colourful orange and red foliage',
        'an open prairie road across flat grassland under a big sky with scattered clouds',
    ];

    /**
     * Run the Python helper (rembg) to build the keep-the-sign mask; returns the temp mask path.
     */
    private function buildSignMask(string $imagePath): string
    {
        $maskPath = tempnam(sys_get_temp_dir(), 'mask_').'.png';

        $result = Process::timeout(120)->run([
            (string) config('services.ideogram.python_bin'),
            (string) config('services.ideogram.mask_script'),
            $imagePath,
            $maskPath,
        ]);

        if ($result->failed()) {
            throw new \RuntimeException('Sign mask helper failed: '.trim($result->errorOutput() ?: $result->output()));
        }

        return $maskPath;
    }

    /**
     * The inpaint prompt: replace the surroundings with a varied setting, keep the sign untouched.
     */
    private function buildBackgroundPrompt(int $id): string
    {
        $setting = self::BACKGROUND_SETTINGS[$id % count(self::BACKGROUND_SETTINGS)];

        return 'Replace the surroundings with '.$setting.'. Keep the existing road sign exactly as it '
            .'is — do not change the sign, its shape, colour, or symbol in any way. Photorealistic, wide '
            .'landscape, realistic lighting and shadows. Do not add any watermark, logo, extra sign, or '
            .'any text.';
    }
}
