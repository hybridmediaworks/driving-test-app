<?php

namespace App\Services\Entitlement;

use App\Enums\EntitlementStatus;
use App\Enums\EntitlementTier;
use Illuminate\Support\Carbon;

final readonly class AccessGrant
{
    public function __construct(
        public EntitlementTier $tier,
        public EntitlementStatus $status,
        public ?Carbon $accessUntil,
        public ?int $vehicleTypeId,
        public ?int $familyGroupId = null,
    ) {}
}
