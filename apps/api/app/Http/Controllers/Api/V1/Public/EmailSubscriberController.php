<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\SubscribeRequest;
use App\Models\EmailSubscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class EmailSubscriberController extends Controller
{
    /**
     * Subscribe to the daily-question email
     *
     * Public, no auth. Captures an email (plus the site's selected state) from the home page
     * signup. Upserts on `email` so a repeat submission — or a previously unsubscribed address —
     * reactivates the same row rather than failing the unique constraint (never creates a
     * duplicate). `state`/`source`/`vehicle_type` are only overwritten when actually provided, so
     * a bare re-subscribe never wipes them. The response message distinguishes a brand-new
     * signup, a reactivation, and a no-op repeat submission by an already-active subscriber —
     * without this, all three looked identical to the caller.
     */
    public function store(SubscribeRequest $request): JsonResponse
    {
        $data = $request->validated();

        $wasAlreadyActive = EmailSubscriber::query()
            ->where('email', $data['email'])
            ->whereNull('unsubscribed_at')
            ->exists();

        $attributes = array_filter(
            [
                'state' => $data['state'] ?? null,
                'source' => $data['source'] ?? null,
                'vehicle_type' => $data['vehicle_type'] ?? null,
            ],
            static fn ($value): bool => $value !== null,
        );
        $attributes['unsubscribed_at'] = null;

        $subscriber = EmailSubscriber::query()->updateOrCreate(
            ['email' => $data['email']],
            $attributes,
        );

        // Never rotate an existing token — that would break a previously-emailed unsubscribe link.
        if (! $subscriber->unsubscribe_token) {
            $subscriber->update(['unsubscribe_token' => Str::random(40)]);
        }

        $message = match (true) {
            $subscriber->wasRecentlyCreated => __("You're subscribed! Look out for a question in your inbox each morning."),
            $wasAlreadyActive => __("You're already subscribed — look out for a question in your inbox each morning."),
            default => __('Welcome back! You\'re subscribed again.'),
        };

        return response()->json(['message' => $message], $subscriber->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Unsubscribe from the daily-question email
     *
     * Public, no auth. The token is resolved via route-model binding, so an unknown token 404s
     * before this method ever runs. Idempotent — unsubscribing twice is harmless.
     */
    public function unsubscribe(EmailSubscriber $emailSubscriber): JsonResponse
    {
        $emailSubscriber->update(['unsubscribed_at' => now()]);

        return response()->json([
            'message' => __("You're unsubscribed. Sorry to see you go."),
        ]);
    }
}
