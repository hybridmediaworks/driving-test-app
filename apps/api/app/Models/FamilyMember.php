<?php

namespace App\Models;

use App\Enums\FamilyInviteStatus;
use App\Enums\FamilyMemberRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FamilyMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'family_group_id',
        'user_id',
        'role',
        'invited_email',
        'invite_token',
        'invite_status',
        'invited_at',
        'claimed_at',
    ];

    protected function casts(): array
    {
        return [
            'role' => FamilyMemberRole::class,
            'invite_status' => FamilyInviteStatus::class,
            'invited_at' => 'datetime',
            'claimed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<FamilyGroup, $this>
     */
    public function familyGroup(): BelongsTo
    {
        return $this->belongsTo(FamilyGroup::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
