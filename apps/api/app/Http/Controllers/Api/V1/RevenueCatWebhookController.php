<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Receives RevenueCat's server-to-server webhooks and mirrors the user's store subscription state
 * into `users.revenuecat_premium_until`, which EntitlementResolver reads to grant premium.
 *
 * Auth: RevenueCat sends the exact `Authorization` header value configured in its dashboard —
 * compared against `REVENUECAT_WEBHOOK_AUTH`. The mobile app sets `app_user_id` to our user id
 * (via `Purchases.logIn(userId)`), so the event maps straight back to a User.
 */
class RevenueCatWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        $expected = config('services.revenuecat.webhook_auth');
        if (empty($expected) || ! hash_equals((string) $expected, (string) $request->header('Authorization', ''))) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $event = $request->input('event', []);
        $type = $event['type'] ?? null;
        $appUserId = $event['app_user_id'] ?? null;

        // Anonymous / not-yet-linked purchases have no app_user_id we can resolve — ack so RevenueCat
        // stops retrying; the entitlement syncs once the app calls Purchases.logIn(userId).
        $user = $appUserId !== null ? User::find($appUserId) : null;
        if ($user === null) {
            return response()->json(['message' => 'No matching user.']);
        }

        if ($type === 'EXPIRATION' || $type === 'SUBSCRIPTION_PAUSED') {
            $user->revenuecat_premium_until = null;
        } else {
            // INITIAL_PURCHASE, RENEWAL, PRODUCT_CHANGE, UNCANCELLATION, NON_RENEWING_PURCHASE,
            // CANCELLATION and BILLING_ISSUE all keep access until the entitlement's expiry — a
            // cancel just stops the *next* renewal, so we still honor `expiration_at_ms`.
            $expirationMs = $event['expiration_at_ms'] ?? null;
            $user->revenuecat_premium_until = $expirationMs !== null
                ? Carbon::createFromTimestampMs((int) $expirationMs)
                // A non-renewing / lifetime product has no expiry — grant far-future access.
                : now()->addYears(100);
        }

        $user->save();

        Log::info('RevenueCat webhook applied', [
            'type' => $type,
            'user_id' => $user->id,
            'premium_until' => $user->revenuecat_premium_until,
        ]);

        return response()->json(['message' => 'ok']);
    }
}
