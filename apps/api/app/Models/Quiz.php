<?php

namespace App\Models;

use App\Enums\TestTrack;
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
    use HasFactory, InteractsWithMedia;

    public const MEDIA_COLLECTION_COVER = 'cover';

    protected $fillable = [
        'quiz_category_id',
        'quiz_type_id',
        'state_id',
        'vehicle_type_id',
        'title',
        'slug',
        'order_no',
        'test_track',
        'total_questions',
        'duration_seconds',
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
     * @return HasMany<QuizQuestion, $this>
     */
    public function quizQuestions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class)->orderBy('sort_order');
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
