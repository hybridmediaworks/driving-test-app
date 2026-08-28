<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Powers the quiz AI tutor (hint / ask) via Groq's OpenAI-compatible API. The key you set as
    // GROK_API_KEY (gsk_...) is a Groq key. To target xAI Grok instead, set GROK_BASE_URL to
    // https://api.x.ai/v1, GROK_MODEL to a grok-* model, and use an xai-... key.
    'grok' => [
        'key' => env('GROK_API_KEY'),
        'model' => env('GROK_MODEL', 'openai/gpt-oss-20b'),
        'base_url' => env('GROK_BASE_URL', 'https://api.groq.com/openai/v1'),
    ],

    // Ideogram image API — regenerates copyright-free quiz question images (describe -> generate).
    // Set IDEOGRAM_API_KEY only in the environment; it is never committed.
    'ideogram' => [
        'key' => env('IDEOGRAM_API_KEY'),
        'base_url' => env('IDEOGRAM_BASE_URL', 'https://api.ideogram.ai'),
        'rendering_speed' => env('IDEOGRAM_RENDERING_SPEED', 'DEFAULT'),
        'style_type' => env('IDEOGRAM_STYLE_TYPE', 'REALISTIC'),
        // Source images are 1080x420 (~2.57:1). Generate a wider 3:1 and centre-crop down, so the
        // vertical content (road + sky) is preserved rather than cropped.
        'aspect_ratio' => env('IDEOGRAM_ASPECT_RATIO', '3x1'),
        // Elements to actively exclude. This is the STRONGEST lever against Ideogram's habit of
        // sprinkling stray letters/characters on the road and vehicles (the positive prompt only asks;
        // negation is what the sampler actually suppresses). Tune on the server via IDEOGRAM_NEGATIVE_PROMPT
        // (an env change, no image rebuild) if a specific artifact keeps slipping through.
        'negative_prompt' => env('IDEOGRAM_NEGATIVE_PROMPT', 'extra sign, second sign, sub-sign, name plate, '
            .'banner, caption, label, added text, words, letters, alphabet, alphabet characters, single '
            .'letters, floating letters, stray letters, characters, symbols, numbers, digits, text on road, '
            .'text on car, painted road text, road markings text, writing, text overlay, random marks, '
            .'watermark, logo, signature, gibberish text, misspelled text'),
        // Everything runs through Remix (image-to-image) — a single strong prompt, no masks. Scene images
        // use this weight: higher keeps arrows/labels truer, lower allows a stronger car recolour.
        'remix_image_weight' => (int) env('IDEOGRAM_REMIX_IMAGE_WEIGHT', 88),
        'remix_rendering_speed' => env('IDEOGRAM_REMIX_RENDERING_SPEED', 'QUALITY'),
        // Sign/symbol images use a HIGHER weight so the fragile pictogram survives the re-render (a wrong
        // symbol = wrong answer). Only the background varies; the prompt forbids touching the symbol.
        'remix_sign_image_weight' => (int) env('IDEOGRAM_REMIX_SIGN_IMAGE_WEIGHT', 95),
    ],

    // Mobile store subscriptions (Apple / Google) are processed by RevenueCat; its server webhook
    // authenticates with this shared secret (set the same value in the RevenueCat dashboard).
    'revenuecat' => [
        'webhook_auth' => env('REVENUECAT_WEBHOOK_AUTH'),
    ],

];
