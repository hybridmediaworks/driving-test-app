<?php

namespace App\Models;

use App\Enums\TestTrack;
use App\Models\Concerns\BelongsToStateAndVehicleType;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Quiz extends Model implements HasMedia
{
    use BelongsToStateAndVehicleType, HasFactory, InteractsWithMedia;

    public const MEDIA_COLLECTION_COVER = 'cover';

    protected $fillable = [
        'quiz_category_id',
        'quiz_type_id',
        'state_id',
        'vehicle_type_id',
        'title',
        'slug',
        'source_url',
        'order_no',
        'test_track',
        'total_questions',
        'duration_seconds',
        'passing_score_percent',
        'is_premium',
        'is_active',
    ];

    protected $appends = [
        'cover_image_url',
    ];

    protected function casts(): array
    {
        return [
            'test_track' => TestTrack::class,
            'is_premium' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection(self::MEDIA_COLLECTION_COVER)
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(800)
            ->format('webp')
            ->performOnCollections(self::MEDIA_COLLECTION_COVER);
    }

    /**
     * @return BelongsTo<QuizCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(QuizCategory::class, 'quiz_category_id');
    }

    /**
     * @return BelongsTo<QuizType, $this>
     */
    public function quizType(): BelongsTo
    {
        return $this->belongsTo(QuizType::class);
    }

    /**
     * @return HasMany<QuizQuestion, $this>
     */
    public function quizQuestions(): HasMany
    {
        // `id` tiebreaker keeps the order deterministic even if two rows share a sort_order.
        return $this->hasMany(QuizQuestion::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * @return HasMany<QuizAttempt, $this>
     */
    public function attempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    public function syncTotalQuestions(): void
    {
        $this->update([
            'total_questions' => $this->quizQuestions()->count(),
        ]);
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function coverImageUrl(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->getFirstMediaUrl(self::MEDIA_COLLECTION_COVER) ?: null);
    }

    public function coverMedia(): ?Media
    {
        return $this->getFirstMedia(self::MEDIA_COLLECTION_COVER);
    }
}
