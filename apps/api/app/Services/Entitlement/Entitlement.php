<?php

namespace App\Services\Entitlement;

use App\Enums\EntitlementStatus;
use App\Enums\EntitlementTier;
use App\Enums\Feature;
use Illuminate\Support\Carbon;

final readonly class Entitlement
{
    public function __construct(
        public EntitlementTier $tier,
        public EntitlementStatus $status,
        public ?Carbon $accessUntil,
        public ?int $familyGroupId,
        public bool $isAdmin,
        public ?array $vehicleTypeIds,
    ) {}

    public function isPremium(): bool
    {
        return $this->isAdmin || $this->hasPaidAccess();
    }

    public function hasPaidAccess(): bool
    {
        if (! in_array($this->status, [EntitlementStatus::Active, EntitlementStatus::GracePeriod], true)) {
            return false;
        }

        return ! in_array($this->tier, [EntitlementTier::Guest, EntitlementTier::Free], true);
    }

    public function coversVehicle(?int $vehicleTypeId): bool
    {
        if (! $this->hasPaidAccess()) {
            return false;
        }

        return $vehicleTypeId === null
            || $this->vehicleTypeIds === null
            || in_array($vehicleTypeId, $this->vehicleTypeIds, true);
    }

    public function hasFeature(Feature $feature, ?int $vehicleTypeId = null): bool
    {
        return $this->isAdmin || $this->coversVehicle($vehicleTypeId);
    }
}
