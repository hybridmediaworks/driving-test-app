<?php

namespace App\Models;

use App\Enums\PassGuaranteeClaimStatus;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class PassGuaranteeClaim extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    public const MEDIA_COLLECTION_PROOF = 'proof';

    protected $fillable = [
        'user_id',
        'plan_id',
        'family_group_id',
        'status',
        'completed_practice_at',
        'exam_date',
        'proof_notes',
        'admin_user_id',
        'admin_notes',
        'decided_at',
        'refunded_at',
        'stripe_refund_id',
        'refund_amount_cents',
    ];

    protected $appends = [
        'proof_urls',
    ];

    protected function casts(): array
    {
        return [
            'status' => PassGuaranteeClaimStatus::class,
            'completed_practice_at' => 'datetime',
            'exam_date' => 'date',
            'decided_at' => 'datetime',
            'refunded_at' => 'datetime',
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection(self::MEDIA_COLLECTION_PROOF)
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']);
    }

    /**
     * @return Attribute<list<string>, never>
     */
    protected function proofUrls(): Attribute
    {
        return Attribute::get(fn (): array => $this->getMedia(self::MEDIA_COLLECTION_PROOF)
            ->map(fn ($media) => $media->getUrl())
            ->values()
            ->all());
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Plan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
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
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }
}
