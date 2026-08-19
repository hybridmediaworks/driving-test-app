<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\QuizQuestionAsset;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class QuizQuestionAssetController extends Controller
{
    /**
     * Stream a locally-stored quiz question asset (currently only Lottie animation JSON).
     *
     * Lottie is loaded by the player via `fetch()`, which — unlike an `<img>` tag — is subject to
     * CORS. Static `/storage` responses don't carry CORS headers (and under `php artisan serve` they
     * bypass Laravel middleware entirely), so once an asset is self-hosted its `url` points here
     * instead of straight at the storage disk: this route lives under `api/*`, which is covered by
     * the CORS middleware, so the cross-origin frontend fetch succeeds.
     */
    public function content(QuizQuestionAsset $asset): StreamedResponse
    {
        abort_unless($asset->disk && $asset->path, 404);

        $disk = Storage::disk($asset->disk);
        abort_unless($disk->exists($asset->path), 404);

        return $disk->response($asset->path, headers: ['Content-Type' => 'application/json']);
    }
}
