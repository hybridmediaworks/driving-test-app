<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class CheatSheet extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    public const MEDIA_COLLECTION_COVER = 'cover';

    public const MEDIA_COLLECTION_PDF = 'pdf';

    protected $fillable = [
        'quiz_category_id',
        'state_id',
        'vehicle_type_id',
        'title',
        'slug',
        'summary',
        'is_premium',
        'is_active',
        'order_no',
    ];

    protected $appends = [
        'cover_image_url',
    ];

    protected function casts(): array
    {
        return [
            'is_premium' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection(self::MEDIA_COLLECTION_COVER)
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

        // The lazily-generated, cached rendered PDF — cleared whenever sections change so the
        // next download regenerates from current content instead of silently going stale.
        $this->addMediaCollection(self::MEDIA_COLLECTION_PDF)
            ->singleFile()
            ->acceptsMimeTypes(['application/pdf']);
    }

    /**
     * @return BelongsTo<QuizCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(QuizCategory::class, 'quiz_category_id');
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
     * @return HasMany<CheatSheetSection, $this>
     */
    public function sections(): HasMany
    {
        return $this->hasMany(CheatSheetSection::class)->orderBy('sort_order');
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function coverImageUrl(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->getFirstMediaUrl(self::MEDIA_COLLECTION_COVER) ?: null);
    }

    public function cachedPdfMedia(): ?Media
    {
        return $this->getFirstMedia(self::MEDIA_COLLECTION_PDF);
    }
}
