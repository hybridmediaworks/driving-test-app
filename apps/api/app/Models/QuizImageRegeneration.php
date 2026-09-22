<?php

namespace App\Models;

use App\Enums\ImageRegenerationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class QuizImageRegeneration extends Model
{
    use HasFactory;

    protected $fillable = [
        'source_url',
        'representative_media_id',
        'representative_asset_id',
        'vehicle_type_id',
        'usage_count',
        'question_context',
        'status',
        'prompt',
        'candidate_disk',
        'candidate_path',
        'backup_path',
        'attempts',
        'error',
        'admin_user_id',
        'decided_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ImageRegenerationStatus::class,
            'decided_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }

    /**
     * @return BelongsTo<VehicleType, $this>
     */
    public function vehicleType(): BelongsTo
    {
        return $this->belongsTo(VehicleType::class);
    }

    /**
     * The representative `quiz_question_assets` row, for images stored as shared files rather than
     * per-question media (how the CDL import stores them). Mutually exclusive with {@see Media()}.
     *
     * @return BelongsTo<QuizQuestionAsset, $this>
     */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(QuizQuestionAsset::class, 'representative_asset_id');
    }

    /**
     * The representative Spatie media row for this unique image (used to resolve the live file path
     * and public URL). Not an Eloquent relation because `media` is Spatie-managed.
     */
    public function media(): ?Media
    {
        return $this->representative_media_id
            ? Media::query()->find($this->representative_media_id)
            : null;
    }

    /**
     * Disk and path of the live original, whichever way it is stored — per-question media, or the
     * shared asset file the CDL import uses. Asset-only rows have no media row at all, so anything
     * that reads the original (or stages a candidate beside it) has to go through this rather than
     * {@see media()}. Null when the asset has not been localized yet (external_url only).
     *
     * @return array{disk: string, path: string}|null
     */
    public function originalFile(): ?array
    {
        $media = $this->media();
        if ($media !== null) {
            return ['disk' => $media->disk, 'path' => $media->getPathRelativeToRoot()];
        }

        $asset = $this->asset;

        return $asset?->disk && $asset->path ? ['disk' => $asset->disk, 'path' => $asset->path] : null;
    }
}
