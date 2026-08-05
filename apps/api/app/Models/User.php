<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Cashier\Billable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'is_admin'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use Billable, HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    /**
     * @return HasMany<QuizAttempt, $this>
     */
    public function quizAttempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    /**
     * @return HasMany<FlashcardReview, $this>
     */
    public function flashcardReviews(): HasMany
    {
        return $this->hasMany(FlashcardReview::class);
    }

    /**
     * The family-plan seat this user occupies, if any — as a member or as the owner (the owner
     * always has their own claimed `family_members` row too, see EntitlementResolver). A user can
     * belong to at most one family group, enforced by the unique index on `family_members.user_id`.
     *
     * @return HasOne<FamilyMember, $this>
     */
    public function familyMembership(): HasOne
    {
        return $this->hasOne(FamilyMember::class);
    }

    /**
     * @return HasMany<FamilyGroup, $this>
     */
    public function ownedFamilyGroups(): HasMany
    {
        return $this->hasMany(FamilyGroup::class, 'owner_user_id');
    }

    /**
     * @return HasMany<PassGuaranteeClaim, $this>
     */
    public function passGuaranteeClaims(): HasMany
    {
        return $this->hasMany(PassGuaranteeClaim::class);
    }
}
