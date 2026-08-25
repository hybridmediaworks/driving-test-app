<?php

namespace App\Services\Ideogram;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Thin wrapper over the Ideogram REST API for the two calls the regeneration pipeline needs:
 * `describe` (image -> caption) and v3 `generate` (caption -> new image). Auth is the `Api-Key`
 * header. Generated image URLs are short-lived, so callers must download the bytes immediately.
 */
class IdeogramClient
{
    public function key(): string
    {
        $key = config('services.ideogram.key');
        if (! is_string($key) || $key === '') {
            throw new RuntimeException('IDEOGRAM_API_KEY is not set.');
        }

        return $key;
    }

    private function url(string $path): string
    {
        return rtrim((string) config('services.ideogram.base_url'), '/').$path;
    }

    /**
     * Caption an image. Returns the first description text, or null if none came back.
     */
    public function describe(string $imagePath): ?string
    {
        $response = Http::withHeaders(['Api-Key' => $this->key()])
            ->attach('image_file', file_get_contents($imagePath), basename($imagePath))
            ->timeout(60)
            ->post($this->url('/describe'))
            ->throw();

        $text = $response->json('descriptions.0.text');

        return is_string($text) && $text !== '' ? $text : null;
    }

    /**
     * Generate a brand-new image from a prompt (Ideogram v3). Returns the temporary result URL —
     * download it right away, the link expires quickly.
     */
    public function generate(string $prompt): string
    {
        $response = Http::withHeaders(['Api-Key' => $this->key()])
            ->asMultipart()
            ->timeout(120)
            ->post($this->url('/v1/ideogram-v3/generate'), array_filter([
                'prompt' => $prompt,
                'negative_prompt' => (string) config('services.ideogram.negative_prompt'),
                'aspect_ratio' => (string) config('services.ideogram.aspect_ratio'),
                'rendering_speed' => (string) config('services.ideogram.rendering_speed'),
                'style_type' => (string) config('services.ideogram.style_type'),
                'num_images' => 1,
            ], fn ($v) => $v !== '' && $v !== null))
            ->throw();

        $url = $response->json('data.0.url');
        if (! is_string($url) || $url === '') {
            throw new RuntimeException('Ideogram generate returned no image URL.');
        }

        return $url;
    }

    /**
     * Remix an existing image (Ideogram v3, image-to-image). The input image is fed in, so the exact
     * subject/symbol is preserved while the scene is re-rendered. Returns the temporary result URL.
     */
    public function remix(string $imagePath, string $prompt, ?int $imageWeight = null): string
    {
        $response = Http::withHeaders(['Api-Key' => $this->key()])
            ->attach('image', file_get_contents($imagePath), basename($imagePath))
            ->timeout(120)
            ->post($this->url('/v1/ideogram-v3/remix'), array_filter([
                'prompt' => $prompt,
                // Signs pass a higher weight (protect the fragile pictogram); scenes use the config default.
                'image_weight' => $imageWeight ?? (int) config('services.ideogram.remix_image_weight'),
                'negative_prompt' => (string) config('services.ideogram.negative_prompt'),
                'aspect_ratio' => (string) config('services.ideogram.aspect_ratio'),
                // Signs get their own (higher) speed — they must be crisp to keep the symbol readable.
                'rendering_speed' => (string) config('services.ideogram.remix_rendering_speed'),
                'style_type' => (string) config('services.ideogram.style_type'),
                'num_images' => 1,
            ], fn ($v) => $v !== '' && $v !== null))
            ->throw();

        $url = $response->json('data.0.url');
        if (! is_string($url) || $url === '') {
            throw new RuntimeException('Ideogram remix returned no image URL.');
        }

        return $url;
    }

    /**
     * Inpaint (Ideogram v3 Edit). The mask's WHITE areas are kept exactly and BLACK areas are
     * regenerated from the prompt — so a sign painted white survives untouched while the background
     * is replaced. Returns the temporary result URL.
     */
    public function edit(string $imagePath, string $maskPath, string $prompt): string
    {
        $response = Http::withHeaders(['Api-Key' => $this->key()])
            ->attach('image', file_get_contents($imagePath), basename($imagePath))
            ->attach('mask', file_get_contents($maskPath), basename($maskPath))
            ->timeout(180)
            ->post($this->url('/v1/ideogram-v3/edit'), array_filter([
                'prompt' => $prompt,
                // Only the regenerated (BLACK) region is affected — the kept sign/overlays are untouched —
                // so suppressing stray text/letters here just keeps the fresh background clean.
                'negative_prompt' => (string) config('services.ideogram.negative_prompt'),
                'rendering_speed' => (string) config('services.ideogram.remix_rendering_speed'),
                'style_type' => (string) config('services.ideogram.style_type'),
                'num_images' => 1,
            ], fn ($v) => $v !== '' && $v !== null))
            ->throw();

        $url = $response->json('data.0.url');
        if (! is_string($url) || $url === '') {
            throw new RuntimeException('Ideogram edit returned no image URL.');
        }

        return $url;
    }
}
