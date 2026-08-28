<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

/**
 * The one site-wide "accuracy verified by" reviewer badge shown on state pages and quiz pages —
 * a singleton in practice (always exactly one row; see ReviewerProfile::current()), editable by
 * an admin so the name/photo/verification date can be updated without a deploy.
 */
class ReviewerProfile extends Model implements HasMedia
{
    use InteractsWithMedia;

    public const MEDIA_COLLECTION_PHOTO = 'photo';

    protected $fillable = [
        'name',
        'title',
        'verified_at',
    ];

    protected $appends = [
        'photo_url',
    ];

    protected function casts(): array
    {
        return [
            'verified_at' => 'date',
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection(self::MEDIA_COLLECTION_PHOTO)
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function photoUrl(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->getFirstMediaUrl(self::MEDIA_COLLECTION_PHOTO) ?: null);
    }

    /**
     * The current (only) reviewer profile, creating a placeholder row on first access so callers
     * never have to handle "no profile exists yet" — the seeder already inserts one, but this is
     * a safety net for a fresh environment that skipped seeding.
     */
    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'name' => 'Our editorial team',
            'title' => 'DMV Test-Prep Editor',
            'verified_at' => now(),
        ]);
    }
}
