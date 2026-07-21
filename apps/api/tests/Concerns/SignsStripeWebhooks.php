<?php

namespace Tests\Concerns;

use Illuminate\Testing\TestResponse;

trait SignsStripeWebhooks
{
    /**
     * Posts a hand-built Stripe event payload to the webhook endpoint with a real, valid
     * `Stripe-Signature` header — exercising Cashier's actual VerifyWebhookSignature middleware
     * rather than bypassing it, so these tests prove the whole pipeline, not just our handlers.
     *
     * @param  array<string, mixed>  $payload
     */
    protected function postSignedStripeWebhook(array $payload): TestResponse
    {
        $secret = 'whsec_test_secret';
        config(['cashier.webhook.secret' => $secret]);

        $json = json_encode($payload);
        $timestamp = time();
        $signature = hash_hmac('sha256', "{$timestamp}.{$json}", $secret);

        return $this->postJson('/api/v1/stripe/webhook', $payload, [
            'Stripe-Signature' => "t={$timestamp},v1={$signature}",
        ]);
    }
}
