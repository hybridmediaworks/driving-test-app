<?php

namespace App\Actions\PassGuarantee;

use App\Enums\PassGuaranteeClaimStatus;
use App\Mail\PassGuaranteeClaimDecidedMail;
use App\Models\PassGuaranteeClaim;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class IssueRefund
{
    public function __invoke(PassGuaranteeClaim $claim): PassGuaranteeClaim
    {
        if ($claim->status !== PassGuaranteeClaimStatus::Approved) {
            throw ValidationException::withMessages(['status' => __('Only approved claims can be refunded.')]);
        }

        if ($claim->family_group_id !== null) {
            $claim->loadMissing('familyGroup');
            $paymentIntentId = $claim->familyGroup?->stripe_payment_intent_id;
            $refundAmountCents = $claim->familyGroup?->plan?->price_cents;
        } else {
            $paymentIntentId = $this->latestInvoicePaymentIntent($claim->user);
            $refundAmountCents = $claim->plan?->price_cents;
        }

        if ($paymentIntentId === null) {
            throw ValidationException::withMessages(['status' => __('No payment could be found to refund for this claim.')]);
        }

        $refund = $claim->user->refund($paymentIntentId);

        $claim->update([
            'status' => PassGuaranteeClaimStatus::Refunded,
            'refunded_at' => now(),
            'stripe_refund_id' => $refund->id,
            'refund_amount_cents' => $refundAmountCents,
        ]);

        Mail::to($claim->user->email)->send(new PassGuaranteeClaimDecidedMail($claim));

        return $claim->fresh();
    }

    /**
     * Stripe's invoice payment-intent isn't a flat field on this API version — it lives under the
     * invoice's `payments` list, which isn't included by default and needs an explicit refresh.
     * See Cashier's own `ManagesInvoices::invoice()` for the same access pattern.
     */
    private function latestInvoicePaymentIntent(User $user): ?string
    {
        $invoice = $user->invoices()->first();

        if ($invoice === null) {
            return null;
        }

        $payments = $invoice->refresh(['payments'])->asStripeInvoice()->payments->data ?? [];

        if (empty($payments)) {
            return null;
        }

        $latestPayment = end($payments);

        return $latestPayment->payment->payment_intent ?? null;
    }
}
