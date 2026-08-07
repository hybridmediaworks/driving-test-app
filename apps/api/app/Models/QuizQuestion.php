<?php

namespace App\Models;

use App\Enums\QuestionDifficulty;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class QuizQuestion extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    public const MEDIA_COLLECTION_IMAGES = 'images';

    protected $fillable = [
        'quiz_id',
        'question_text',
        'explanation',
        'difficulty',
        'topic',
        'sort_order',
    ];

    protected $appends = [
        'image_urls',
    ];

    protected function casts(): array
    {
        return [
            'difficulty' => QuestionDifficulty::class,
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection(self::MEDIA_COLLECTION_IMAGES)
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(480)
            ->format('webp')
            ->performOnCollections(self::MEDIA_COLLECTION_IMAGES);
    }

    /**
     * @return Attribute<list<string>, never>
     */
    protected function imageUrls(): Attribute
    {
        return Attribute::get(fn (): array => $this->getMedia(self::MEDIA_COLLECTION_IMAGES)
            ->map(fn ($media) => $media->getUrl())
            ->values()
            ->all());
    }

    /**
     * @return BelongsTo<Quiz, $this>
     */
    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    /**
     * @return HasMany<QuizAnswer, $this>
     */
    public function answers(): HasMany
    {
        return $this->hasMany(QuizAnswer::class)->orderBy('sort_order');
    }

    /**
     * @return HasMany<QuizQuestionAsset, $this>
     */
    public function assets(): HasMany
    {
        return $this->hasMany(QuizQuestionAsset::class)->orderBy('sort_order');
    }
}
