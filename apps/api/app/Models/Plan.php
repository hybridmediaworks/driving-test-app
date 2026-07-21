<?php

namespace App\Models;

use App\Enums\BillingInterval;
use App\Enums\PlanType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'name',
        'type',
        'billing_interval',
        'price_cents',
        'stripe_price_id',
        'stripe_product_id',
        'max_seats',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'type' => PlanType::class,
            'billing_interval' => BillingInterval::class,
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return HasMany<FamilyGroup, $this>
     */
    public function familyGroups(): HasMany
    {
        return $this->hasMany(FamilyGroup::class);
    }
}
