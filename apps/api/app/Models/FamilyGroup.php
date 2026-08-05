<?php

namespace App\Models;

use App\Enums\FamilyGroupStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FamilyGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_user_id',
        'plan_id',
        'stripe_payment_intent_id',
        'max_seats',
        'status',
        'purchased_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => FamilyGroupStatus::class,
            'purchased_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    /**
     * @return BelongsTo<Plan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * @return HasMany<FamilyMember, $this>
     */
    public function members(): HasMany
    {
        return $this->hasMany(FamilyMember::class);
    }

    public function isActive(): bool
    {
        return $this->status === FamilyGroupStatus::Active;
    }
}
