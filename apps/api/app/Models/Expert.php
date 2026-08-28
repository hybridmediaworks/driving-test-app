<?php

namespace App\Models;

use Database\Factories\ExpertFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * A content reviewer with a public profile page at /experts/{slug} (bio, credentials,
 * methodology, publications, …) and a compact "verified by" trust badge on state and quiz pages.
 * Admin-managed so the roster, copy, photos and verification dates change without a deploy.
 *
 * @property array<int, array{heading: string, body: string}>|null $sections
 */
class Expert extends Model implements HasMedia
{
    /** @use HasFactory<ExpertFactory> */
    use HasFactory;

    use InteractsWithMedia;

    public const MEDIA_COLLECTION_PHOTO = 'photo';

    protected $fillable = [
        'slug',
        'name',
        'title',
        'credentials',
        'role_label',
        'intro',
        'linkedin_url',
        'email',
        'sections',
        'verified_at',
        'sort_order',
        'is_published',
    ];

    protected $appends = [
        'photo_url',
    ];

    protected function casts(): array
    {
        return [
            'sections' => 'array',
            'verified_at' => 'date',
            'sort_order' => 'integer',
            'is_published' => 'boolean',
        ];
    }

    /**
     * @param  Builder<Expert>  $query
     */
    public function scopePublished(Builder $query): void
    {
        $query->where('is_published', true);
    }

    /**
     * @param  Builder<Expert>  $query
     */
    public function scopeOrdered(Builder $query): void
    {
        $query->orderBy('sort_order')->orderBy('name');
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection(self::MEDIA_COLLECTION_PHOTO)
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        // Normalise every upload to a modestly sized JPEG: whatever odd format came in (e.g. a
        // .jfif, which php artisan serve and nginx don't send a MIME type for) is served back as a
        // plain .jpg that every browser renders. Not queued — no worker to depend on, and the file
        // is tiny.
        $this->addMediaConversion('display')
            ->width(512)
            ->height(512)
            ->format('jpg')
            ->nonQueued()
            ->performOnCollections(self::MEDIA_COLLECTION_PHOTO);
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function photoUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            $media = $this->getFirstMedia(self::MEDIA_COLLECTION_PHOTO);
            if ($media === null) {
                return null;
            }

            // Prefer the normalised 'display' conversion; fall back to the original for any media
            // added before this conversion existed.
            return $media->hasGeneratedConversion('display')
                ? $media->getUrl('display')
                : ($media->getUrl() ?: null);
        });
    }
}
