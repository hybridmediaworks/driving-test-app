<?php

namespace App\Mail;

use App\Models\PassGuaranteeClaim;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PassGuaranteeClaimDecidedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly PassGuaranteeClaim $claim,
    ) {}

    public function build(): self
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        return $this->subject(__('An update on your Pass Guarantee claim'))
            ->view('mail.pass-guarantee-claim-decided', [
                'claim' => $this->claim,
                'claimsUrl' => "{$frontendUrl}/pass-guarantee",
            ]);
    }
}
