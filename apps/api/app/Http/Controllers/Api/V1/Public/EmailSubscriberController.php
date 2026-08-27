<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\SubscribeRequest;
use App\Models\EmailSubscriber;
use Illuminate\Http\JsonResponse;

class EmailSubscriberController extends Controller
{
    /**
     * Subscribe to the daily-question email
     *
     * Public, no auth. Captures an email (plus the site's selected state) from the home page
     * signup. Upserts on `email` so a repeat submission — or a previously unsubscribed address —
     * reactivates the same row rather than failing the unique constraint. `state`/`source` are
     * only overwritten when actually provided, so a bare re-subscribe never wipes them.
     */
    public function store(SubscribeRequest $request): JsonResponse
    {
        $data = $request->validated();

        $attributes = array_filter(
            [
                'state' => $data['state'] ?? null,
                'source' => $data['source'] ?? null,
            ],
            static fn ($value): bool => $value !== null,
        );
        $attributes['unsubscribed_at'] = null;

        $subscriber = EmailSubscriber::query()->updateOrCreate(
            ['email' => $data['email']],
            $attributes,
        );

        return response()->json([
            'message' => __("You're subscribed! Look out for a question in your inbox each morning."),
        ], $subscriber->wasRecentlyCreated ? 201 : 200);
    }
}
