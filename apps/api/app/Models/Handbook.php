<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStateAndVehicleType;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Handbook extends Model implements HasMedia
{
    use BelongsToStateAndVehicleType, HasFactory, InteractsWithMedia;

    public const MEDIA_COLLECTION_PDF = 'pdf';

    protected $fillable = [
        'state_id',
        'vehicle_type_id',
        'language',
        'title',
        'source_url',
        'total_words',
    ];

    protected $appends = [
        'pdf_url',
    ];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection(self::MEDIA_COLLECTION_PDF)
            ->singleFile()
            ->acceptsMimeTypes(['application/pdf']);
    }

    /**
     * @return HasMany<HandbookChapter, $this>
     */
    public function chapters(): HasMany
    {
        return $this->hasMany(HandbookChapter::class)->orderBy('sort_order');
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function pdfUrl(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->getFirstMediaUrl(self::MEDIA_COLLECTION_PDF) ?: null);
    }
}
