<?php

namespace App\Models\Concerns;

use App\Models\State;
use App\Models\VehicleType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Shared by every content model scoped to a single state + vehicle type: Video, Handbook,
 * Flashcard, CheatSheet, Quiz. All five use plain, convention-based `state_id`/`vehicle_type_id`
 * FK columns and identical belongsTo relations — nullability differs per table (NOT NULL on
 * Quiz/Handbook, nullable on Video/Flashcard/CheatSheet) but relation/scope logic here is
 * unaffected by that; belongsTo resolves to null on a null FK regardless.
 */
trait BelongsToStateAndVehicleType
{
    /**
     * @return BelongsTo<State, $this>
     */
    public function state(): BelongsTo
    {
        return $this->belongsTo(State::class);
    }

    /**
     * @return BelongsTo<VehicleType, $this>
     */
    public function vehicleType(): BelongsTo
    {
        return $this->belongsTo(VehicleType::class);
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeForState(Builder $query, string $stateCode): Builder
    {
        return $query->whereHas('state', fn (Builder $q) => $q->where('code', $stateCode));
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeForVehicleType(Builder $query, string $vehicleTypeName): Builder
    {
        return $query->whereHas('vehicleType', fn (Builder $q) => $q->where('name', $vehicleTypeName));
    }

    /**
     * Same as scopeForState, but a null state_id ("applies universally") also matches.
     *
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeApplicableToState(Builder $query, string $stateCode): Builder
    {
        return $query->where(fn (Builder $q) => $q->whereNull('state_id')
            ->orWhereHas('state', fn (Builder $q2) => $q2->where('code', $stateCode)));
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeApplicableToVehicleType(Builder $query, string $vehicleTypeName): Builder
    {
        return $query->where(fn (Builder $q) => $q->whereNull('vehicle_type_id')
            ->orWhereHas('vehicleType', fn (Builder $q2) => $q2->where('name', $vehicleTypeName)));
    }
}
