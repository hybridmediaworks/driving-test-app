<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class AmbientTrack extends Model
{
    use HasFactory;

    protected $fillable = [
        'quiz_category_id',
        'title',
        'external_url',
        'disk',
        'path',
        'is_active',
        'order_no',
    ];

    protected $appends = [
        'url',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<QuizCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(QuizCategory::class, 'quiz_category_id');
    }

    /**
     * Null (not a broken link/500) when the disk is `s3` but no bucket is configured — the AWS
     * SDK throws on `->url()` rather than returning a best-effort string in that case, and local
     * dev/CI never has real S3 credentials to resolve against.
     *
     * @return Attribute<string|null, never>
     */
    protected function url(): Attribute
    {
        return Attribute::get(function (): ?string {
            if ($this->external_url) {
                return $this->external_url;
            }
            if (! $this->disk || ! $this->path) {
                return null;
            }
            if ($this->disk === 's3' && blank(config('filesystems.disks.s3.bucket'))) {
                return null;
            }

            return Storage::disk($this->disk)->url($this->path);
        });
    }
}
