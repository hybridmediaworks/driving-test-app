<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStateAndVehicleType;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Video extends Model implements HasMedia
{
    use BelongsToStateAndVehicleType, HasFactory, InteractsWithMedia;

    public const MEDIA_COLLECTION_THUMBNAIL = 'thumbnail';

    protected $fillable = [
        'quiz_category_id',
        'state_id',
        'vehicle_type_id',
        'test_track',
        'section',
        'subsection',
        'title',
        'slug',
        'description',
        'duration_seconds',
        'source_url',
        'external_url',
        'disk',
        'path',
        'is_premium',
        'is_active',
        'order_no',
    ];

    protected $appends = [
        'thumbnail_url',
        'url',
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
        // The thumbnail is a static image — fine through Media Library, unlike the video/audio
        // source itself (external_url or disk+path above), which deliberately isn't.
        $this->addMediaCollection(self::MEDIA_COLLECTION_THUMBNAIL)
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
     * The interactive hazard-perception layer, when this video is a hazard simulator (section
     * "Defensive Driving Hazard Simulators"). Null for every other video.
     *
     * @return HasOne<HazardSimulator, $this>
     */
    public function hazardSimulator(): HasOne
    {
        return $this->hasOne(HazardSimulator::class);
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function thumbnailUrl(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->getFirstMediaUrl(self::MEDIA_COLLECTION_THUMBNAIL) ?: null);
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function url(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->external_url
            ?? ($this->disk && $this->path ? Storage::disk($this->disk)->url($this->path) : null));
    }
}
