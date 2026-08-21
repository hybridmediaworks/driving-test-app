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
    public function __invoke(QuizImageRegeneration $row, ?string $speedOverride = null): QuizImageRegeneration
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
            if ($this->looksLikeSign($row->question_context)) {
                $maskPath = $this->buildSignMask($originalTmp);
                $prompt = $this->buildBackgroundPrompt($row->id);
                $imageUrl = $this->ideogram->edit($originalTmp, $maskPath, $prompt);
            } else {
                $caption = $this->ideogram->describe($originalTmp);
                $prompt = $this->buildPrompt($caption, $row->question_context);
                $imageUrl = $this->ideogram->generate($prompt);
            }

            $bytes = Http::timeout(60)->get($imageUrl)->throw()->body();

            $tmp = tempnam(sys_get_temp_dir(), 'ideo_').'.jpg';
            File::put($tmp, $bytes);
            Image::load($tmp)->fit(Fit::Crop, self::WIDTH, self::HEIGHT)->save($tmp);

            // Drop any previous candidate before staging the new one.
            if ($row->candidate_disk && $row->candidate_path) {
                Storage::disk($row->candidate_disk)->delete($row->candidate_path);
            }

            $relativePath = "quiz-candidates/{$row->id}/".Str::uuid()->toString().'.jpg';
            Storage::disk('local')->put($relativePath, File::get($tmp));

            $row->update([
                'prompt' => $prompt,
                'candidate_disk' => 'local',
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
     * Scene prompt (Describe -> Generate path, i.e. non-sign traffic/road scenes). It must reproduce
     * the scene faithfully — same vehicles AND their occupants (a rider dropped off a motorcycle is a
     * common failure) — and must NOT invent road signs or any text (the other common failure: a
     * hallucinated gibberish sign). Sign images never reach here; they go through the inpaint path.
     */
    private function buildPrompt(?string $caption, ?string $questionContext): string
    {
        $caption = trim((string) $caption);
        $context = trim((string) $questionContext);

        $parts = [
            'Recreate this US road/traffic scene as a clean, professional, photorealistic image that '
                .'replaces an existing driving-test illustration. Faithfully reproduce the SAME scene: '
                .'the same vehicles (their types, colours, positions and directions of travel), the same '
                .'road layout and lane markings, and KEEP EVERY PERSON present — every motorcycle or '
                .'bicycle MUST have its rider seated on it, and every car its driver, exactly as in the '
                .'reference. Never remove a rider or leave a motorbike riderless.',
        ];

        if ($caption !== '') {
            $parts[] = 'Reference of the scene: '.$caption;
        }

        if ($context !== '') {
            $parts[] = 'For context, the questions about this scene are: '.$context
                .'. Keep the scene\'s meaning intact, but do not render any of these words in the image.';
        }

        $parts[] = 'Hard rules: do NOT add any road signs, warning signs, billboards, plates, or signs '
            .'bearing words; no captions, labels, letters, numbers, watermark, logo, or signature '
            .'anywhere; absolutely no invented or gibberish text of any kind. Photorealistic, wide '
            .'landscape composition, realistic lighting.';

        return implode(' ', $parts);
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
