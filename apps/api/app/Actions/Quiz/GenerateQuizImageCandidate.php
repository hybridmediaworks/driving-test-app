<?php

namespace App\Actions\Quiz;

use App\Enums\ImageRegenerationStatus;
use App\Models\QuizImageRegeneration;
use App\Services\Ideogram\IdeogramClient;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
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
                // Sign: one strong Remix prompt keeps the pictogram/shape/colours EXACT and just puts it
                // in a fresh setting (copyright). Higher image_weight so the fragile symbol survives.
                $prompt = $this->appendCustom($this->buildSignPrompt($row->id), $customPrompt);
                $imageUrl = $this->ideogram->remix($originalTmp, $prompt, (int) config('services.ideogram.remix_sign_image_weight'));
            } else {
                // Scene/traffic image: a single, well-explained Remix prompt does everything — keeps the
                // actual vehicles/arrows/paths/labels, recolours the cars, and drops the watermark. No
                // mask, no image code — just the prompt. Raise IDEOGRAM_REMIX_IMAGE_WEIGHT for truer
                // arrows/labels (at the cost of a lighter recolour).
                $prompt = $this->appendCustom($this->buildScenePrompt($row->id), $customPrompt);
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
            foreach ([$tmp, $originalTmp] as $path) {
                if ($path !== null && File::exists($path)) {
                    File::delete($path);
                }
            }
        }

        return $row->fresh();
    }

    /**
     * The single prompt for every scene/traffic image (Remix path — no mask, no image code). Remix is
     * fed the original (image_weight from config; raise it for truer arrows/labels), so the composition/
     * vehicles/positions carry over; the prompt makes only targeted edits. It recolours the cars (single
     * -> blue, multiple -> distinct natural colours) for copyright distinctness while the scenario stays
     * identical, lifts lane markings, darkens the road, adds roadside buildings, and removes the
     * watermark — and, above all (rule 8), keeps the answer graphics (arrows/paths/cones/icons/labels)
     * exact. Rule 9 applies a per-id subtle colour-grade/lighting shift (SCENE_LOOKS) so each result is
     * visibly distinct from the scraped original. The strict-preservation tail guards composition,
     * vehicle direction, and invented text.
     */
    private function buildScenePrompt(int $id): string
    {
        // Per-image look so each result is visibly distinct from the scraped original (and from each
        // other) — a subtle, natural daytime grade, never so dark that anything becomes hard to read.
        $look = self::SCENE_LOOKS[$id % count(self::SCENE_LOOKS)];

        return 'You are editing a US driving-test question image. TWO THINGS ARE NON-NEGOTIABLE and '
            .'override every other instruction: (a) never change, move, redraw, or remove any coloured '
            .'directional arrow, path line, cone, signal/sensor icon, or letter/number label — these are '
            .'the answer and must stay pixel-identical and legible; (b) never change the number, '
            .'positions, shapes, or facing/direction of the vehicles, and never turn an arrow, path, or '
            .'label into a 3D object, barrier, or sign. Preservation ALWAYS wins over any other '
            .'instruction below. Within those limits, edit the image while preserving the original '
            .'composition, camera angle, perspective, framing, road layout and traffic exactly. Make '
            .'ONLY the following changes: '
            .'1. Recolour the vehicles where you cleanly can: give each car body a realistic natural '
            .'colour different from the original (for a single car, a medium blue; if it is already '
            .'blue, a red), recolouring the whole body while keeping its metallic shading. This is '
            .'SUBORDINATE to preservation — never distort, duplicate, move, reshape, or add a vehicle, '
            .'and never disturb an arrow/label, just to change a colour; if staying faithful keeps a car '
            .'close to its original colour, that is acceptable. '
            .'2. If there are several vehicles, prefer giving each a different natural colour (blue, '
            .'white, black, silver, grey, red, or dark green), each different from its own original — '
            .'but keep every vehicle in exactly the same position, shape, size and orientation, and add '
            .'or remove none. '
            .'IMPORTANT COLOUR EXCEPTION: if a car is paired with a matching-coloured directional arrow '
            .'or path line (for example a red car with a red arrow/path, or a blue car with a blue '
            .'arrow/path), KEEP that car in its original colour so it still matches its path — only '
            .'recolour cars that have NO associated coloured path. '
            .'3. Make the existing yellow and white road lane markings significantly more prominent, '
            .'sharper, and easier to see while keeping their exact original positions and shapes. '
            .'4. DARKEN THE ROAD — this is required. Make the asphalt/road surface clearly and noticeably '
            .'darker: a deeper, richer realistic grey with more contrast, distinctly darker than the '
            .'original, while keeping its exact geometry, lane lines and layout unchanged. '
            .'5. Add realistic buildings along the sides of the existing road, integrated naturally into '
            .'the environment and perspective. Buildings must remain outside the existing roadway and '
            .'must not obstruct, replace, or remove any existing objects. '
            .'6. Make the existing sign board more prominent and visually noticeable only. Do not change '
            ."the sign's text, design, shape, colour, graphics, or content in any way. "
            .'7. Remove the existing watermark completely and reconstruct the underlying area naturally '
            .'so there is no visible trace of the watermark. '
            .'8. THIS IS THE MOST IMPORTANT RULE. Keep EVERY coloured directional arrow, curved path line, '
            .'trajectory indicator, signal/sensor/wifi icon, AND any letter or number label that is on or '
            .'beside a vehicle (such as A, B, C) EXACTLY as in the original — same colour, shape, curve, '
            .'thickness, start point, end point, direction it points, exact glyph, and count. Do NOT '
            .'redraw, move, recolour, distort, straighten, blur, garble, duplicate, add, or remove any '
            .'arrow, path, icon, or label. Every existing label letter must stay crisp and legible as the '
            .'same character. These graphics encode the correct answer to the question and must remain '
            .'pixel-faithful. '
            .'9. OVERALL LOOK — the result must clearly read as a DIFFERENT photograph from the original, '
            .'not a copy. Apply a subtle but real, natural colour-grade and lighting shift to the whole '
            .'scene: render it under '.$look.', giving the road, ground, greenery, sky and vehicles a '
            .'slightly different tone and white balance. Keep it photorealistic and clearly daytime and '
            .'well-lit (never so dark or tinted that anything becomes hard to see). This colour/lighting '
            .'shift applies ONLY to the environment and vehicles — the answer graphics (arrows, paths, '
            .'cones, icons, labels) and any road sign keep their EXACT original colours. '
            .'STRICT PRESERVATION: Do not change, add, remove, resize, reposition, or redesign the '
            .'geometry of the scene. Preserve the exact road perspective, camera position, vehicle '
            .'positions, vehicle shapes, traffic arrangement, road/lane geometry, sidewalks and overall '
            .'composition. Every vehicle must keep the SAME facing and direction of travel as in the '
            .'original — never reverse, flip, or mirror any vehicle. Do NOT invent, scatter, or add any '
            .'letters, numbers, captions, or labels that are not physically in the original. The result '
            .'must be the SAME scene and layout as the original — same everything in place — re-lit and '
            .'re-graded per rule 9, with only the requested modifications. Photorealistic, realistic '
            .'road textures, realistic vehicle colours, seamless edits, no artificial or CGI appearance.';
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

    /**
     * A pool of subtle daytime colour-grade / lighting looks, indexed by row id, so every regenerated
     * scene is visibly distinct from the scraped original (and from other scenes) without ever getting
     * dark or unnatural — the copyright "make it different" lever that keeps the answer readable.
     */
    private const SCENE_LOOKS = [
        'soft warm late-afternoon sunlight with gentle long shadows and a faint golden tone',
        'cool, bright overcast daylight with soft even shadows and a slightly blue-grey tone',
        'crisp clear midday sun with strong clean shadows, vivid greenery and a bright blue sky',
        'hazy diffused daylight with a soft, slightly desaturated low-contrast look',
        'fresh clear morning light with a cool white balance and vivid natural colours',
        'warm sunlit tone with richer, slightly more saturated colours and a clear sky',
        'gentle cloudy daylight with a neutral, muted palette and soft shadows',
        'bright early-day light with a pale sky, cooler tone and lively green foliage',
    ];

    /** A pool of plausible US road settings, so each sign lands in a visibly different place. */
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
     * The single Remix prompt for a road-sign image: reproduce the pictogram EXACTLY and only place it
     * in a fresh roadside setting (varied by id) — no mask, no image code. A high image_weight (config)
     * protects the fragile symbol; the strict wording forbids restyling it or adding any text/sub-sign.
     */
    private function buildSignPrompt(int $id): string
    {
        $setting = self::BACKGROUND_SETTINGS[$id % count(self::BACKGROUND_SETTINGS)];

        return 'This image shows a single US road sign. Reproduce the sign EXACTLY as in the original — '
            .'the same pictogram/symbol, arrows, shape, outline, border, colours and proportions, '
            .'pixel-faithful. Do NOT redraw, simplify, restyle, recolour, mirror, rotate, thicken, or '
            .'alter the symbol in ANY way, and do not add or remove any part of it. Keep it on its post '
            .'and place it in a fresh, clean, photorealistic US roadside setting: '.$setting.'. Remove '
            .'any watermark or logo completely. Do NOT add any extra sign, sub-sign, name plate, caption, '
            .'banner, words, letters, or numbers anywhere. Photorealistic, natural daylight, realistic '
            .'materials, sharp and readable sign, no CGI or cartoon look.';
    }
}
