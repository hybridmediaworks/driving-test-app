<?php

namespace App\Actions\Billing;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Laravel\Cashier\Cashier;
use Stripe\Exception\ApiErrorException;

/**
 * Rebuilds a user's local subscription rows from Stripe.
 *
 * Access normally arrives through `customer.subscription.created`, but a webhook that never lands
 * (an endpoint not configured, a listener not running in local dev, a delivery Stripe gave up on)
 * leaves a paying customer sitting on the free tier with no way back — the charge is real, the app
 * simply never heard about it. This reads the truth straight from Stripe instead, mirroring what
 * Cashier's own webhook handler writes, so a missed delivery repairs itself the next time the
 * subscription is read.
 *
 * Only ever adds or refreshes what Stripe reports; it never deletes local rows, so an unrelated
 * subscription can't be wiped by a partial API response.
 */
class SyncStripeSubscriptions
{
    /** @return int the number of subscriptions written */
    public function __invoke(User $user): int
    {
        if ($user->stripe_id === null) {
            return 0;
        }

        try {
            $subscriptions = Cashier::stripe()->subscriptions->all([
                'customer' => $user->stripe_id,
                'status' => 'all',
                'limit' => 10,
                'expand' => ['data.items'],
            ]);
        } catch (ApiErrorException $e) {
            // Stripe being unreachable must not break reading your own billing status — the caller
            // falls back to whatever is stored locally.
            Log::warning('Stripe subscription sync failed', [
                'user_id' => $user->id,
                'message' => $e->getMessage(),
            ]);

            return 0;
        }

        $written = 0;

        foreach ($subscriptions->data as $data) {
            // Incomplete and abandoned checkouts aren't access; only states Cashier itself treats
            // as live or recoverable are worth writing.
            if (! in_array($data->status, ['active', 'trialing', 'past_due', 'unpaid', 'canceled'], true)) {
                continue;
            }

            $items = $data->items->data;
            $firstItem = $items[0] ?? null;
            $isSinglePrice = count($items) === 1;

            $subscription = $user->subscriptions()->updateOrCreate([
                'stripe_id' => $data->id,
            ], [
                'type' => $data->metadata->type ?? $data->metadata->name ?? 'default',
                'stripe_status' => $data->status,
                'stripe_price' => $isSinglePrice && $firstItem !== null ? $firstItem->price->id : null,
                'quantity' => $isSinglePrice && $firstItem !== null ? ($firstItem->quantity ?? null) : null,
                'trial_ends_at' => $data->trial_end !== null ? Carbon::createFromTimestamp($data->trial_end) : null,
                // Cashier reads `ends_at` as "cancelled, access until" — only a subscription set to
                // stop carries one.
                'ends_at' => $data->cancel_at_period_end || $data->status === 'canceled'
                    ? Carbon::createFromTimestamp($data->cancel_at ?? $data->ended_at ?? $data->current_period_end)
                    : null,
                // Stripe's own creation time, not ours: Cashier resolves subscription('default')
                // as subscriptions()->orderBy('created_at', 'desc')->first(), and a whole sync
                // lands inside one second — a resubscriber's canceled row could come back first
                // and report a paying customer as free.
                'created_at' => Carbon::createFromTimestamp($data->created),
            ]);

            foreach ($items as $item) {
                $subscription->items()->updateOrCreate([
                    'stripe_id' => $item->id,
                ], [
                    'stripe_product' => $item->price->product,
                    'stripe_price' => $item->price->id,
                    'quantity' => $item->quantity ?? null,
                ]);
            }

            $written++;
        }

        if ($written > 0) {
            // The relation was already loaded by whatever checked for a missing subscription.
            $user->unsetRelation('subscriptions');
        }

        return $written;
    }
}
