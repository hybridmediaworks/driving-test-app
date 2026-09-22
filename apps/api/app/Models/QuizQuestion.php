<?php

namespace App\Models;

use App\Enums\QuestionDifficulty;
use App\Enums\QuizQuestionAssetType;
use App\Models\Concerns\HasTranslations;
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
    use HasFactory, HasTranslations, InteractsWithMedia;

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

    /**
     * `image_urls` is appended to every serialization and now reads externally-hosted images out
     * of `assets`, so the relation is needed wherever a question is rendered — eager-loading it
     * here keeps the paths that don't ask for it explicitly (sample questions, challenge bank,
     * admin listings) from going N+1.
     *
     * @var list<string>
     */
    protected $with = ['assets'];

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
        // Two sources, one list: images we host ourselves (Spatie media) and images left at the
        // source URL. The crawled sets reuse a few hundred stock images across hundreds of
        // thousands of questions, so copying a file per reference cost ~17GB for CDL alone —
        // those are stored as `image` assets pointing at the origin instead. Consumers do not
        // need to care which is which.
        return Attribute::get(fn (): array => $this->getMedia(self::MEDIA_COLLECTION_IMAGES)
            ->map(fn ($media) => $media->getUrl())
            ->concat(
                $this->assets
                    ->where('type', QuizQuestionAssetType::Image)
                    ->sortBy('sort_order')
                    // ->url, not ->external_url: the row keeps its origin URL for provenance, but
                    // once `content:localize-quiz-assets --only=images` has pulled the file down the
                    // accessor serves our own copy instead.
                    ->pluck('url')
                    ->filter()
            )
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
        // `id` tiebreaker keeps option order deterministic even if two rows share a sort_order.
        return $this->hasMany(QuizAnswer::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * @return HasMany<QuizQuestionAsset, $this>
     */
    public function assets(): HasMany
    {
        return $this->hasMany(QuizQuestionAsset::class)->orderBy('sort_order');
    }

    /**
     * @return HasMany<QuizAttemptAnswer, $this>
     */
    public function attemptAnswers(): HasMany
    {
        return $this->hasMany(QuizAttemptAnswer::class);
    }
}
