<?php

namespace App\Http\Resources\Api\V1;

use App\Models\PassGuaranteeClaim;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin PassGuaranteeClaim */
class PassGuaranteeClaimResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'completed_practice_at' => $this->completed_practice_at,
            'exam_date' => $this->exam_date,
            'proof_notes' => $this->proof_notes,
            'proof_urls' => $this->proof_urls,
            'admin_notes' => $this->admin_notes,
            'decided_at' => $this->decided_at,
            'refunded_at' => $this->refunded_at,
            'refund_amount_cents' => $this->refund_amount_cents,
            'created_at' => $this->created_at,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
        ];
    }
}
