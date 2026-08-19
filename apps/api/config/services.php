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

];
