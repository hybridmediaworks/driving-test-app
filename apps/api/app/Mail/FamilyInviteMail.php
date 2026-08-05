<?php

namespace App\Mail;

use App\Models\FamilyMember;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class FamilyInviteMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly FamilyMember $member,
    ) {}

    public function build(): self
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        return $this->subject(__('You\'ve been invited to a family plan'))
            ->view('mail.family-invite', [
                'claimUrl' => "{$frontendUrl}/family/claim/{$this->member->invite_token}",
            ]);
    }
}
