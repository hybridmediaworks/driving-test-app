<?php

namespace App\Http\Resources\Api\V1;

use App\Models\User;
use App\Services\Entitlement\EntitlementResolver;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $entitlement = app(EntitlementResolver::class)->resolve($this->resource);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'is_admin' => $this->is_admin,
            'email_verified_at' => $this->email_verified_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'entitlement' => [
                'tier' => $entitlement->tier,
                'status' => $entitlement->status,
                'access_until' => $entitlement->accessUntil,
                'family_group_id' => $entitlement->familyGroupId,
                'is_premium' => $entitlement->isPremium(),
            ],
        ];
    }
}
