<?php

namespace App\Actions\PassGuarantee;

use App\Enums\PassGuaranteeClaimStatus;
use App\Mail\PassGuaranteeClaimDecidedMail;
use App\Models\PassGuaranteeClaim;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class ReviewClaim
{
    public function __invoke(
        PassGuaranteeClaim $claim,
        User $admin,
        PassGuaranteeClaimStatus $decision,
        ?string $adminNotes,
    ): PassGuaranteeClaim {
        if (! in_array($claim->status, [PassGuaranteeClaimStatus::Submitted, PassGuaranteeClaimStatus::UnderReview], true)) {
            throw ValidationException::withMessages(['status' => __('This claim has already been decided.')]);
        }

        $claim->update([
            'status' => $decision,
            'admin_user_id' => $admin->id,
            'admin_notes' => $adminNotes,
            'decided_at' => now(),
        ]);

        Mail::to($claim->user->email)->send(new PassGuaranteeClaimDecidedMail($claim));

        return $claim->fresh();
    }
}
