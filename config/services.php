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

    'nominatim' => [
        'base_url' => env('NOMINATIM_BASE_URL', 'http://localhost:8080'),

        // Requests per second cap. 0 = unlimited (recommended for a
        // self-hosted instance). Set > 0 only when pointing at a rate-limited
        // endpoint such as the public nominatim.openstreetmap.org API.
        'rate_per_second' => (int) env('NOMINATIM_RATE_PER_SECOND', 0),

        'timeout' => (int) env('NOMINATIM_TIMEOUT', 15),

        'user_agent' => env('NOMINATIM_USER_AGENT', 'laravel-events-geocoder'),
    ],

];
