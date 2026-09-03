<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * The interactive layer on top of a Video (1:1). Catalog identity — title, thumbnail, duration,
 * premium flag, state/vehicle scoping — stays on the Video and is reached through `video`.
 */
class HazardSimulator extends Model
{
    use HasFactory;

    protected $fillable = [
        'video_id',
        'slug',
        'sim_id',
        'page_id',
        'provider',
        'provider_video_id',
        'test_level',
        'test_location',
        'test_number',
        'hazard_count',
        'demo_hazard_count',
        'pass_threshold_percent',
        'scoring_profile',
        'is_active',
        'content_locked',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'content_locked' => 'boolean',
            'hazard_count' => 'integer',
            'demo_hazard_count' => 'integer',
            'pass_threshold_percent' => 'integer',
        ];
    }

    /**
     * Recompute the cached rollups off the current hazard rows. Called after any admin add / edit /
     * delete of a hazard, and by the importer after an upsert pass, so the two never drift.
     */
    public function syncHazardCounts(): void
    {
        $this->forceFill([
            'hazard_count' => $this->hazards()->where('in_timeline', true)->count(),
            'demo_hazard_count' => $this->hazards()->where('mode', 'demo')->count(),
        ])->save();
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * @return BelongsTo<Video, $this>
     */
    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }

    /**
     * The full hazard pool (scored + pool-only), ordered for the timeline first.
     *
     * @return HasMany<Hazard, $this>
     */
    public function hazards(): HasMany
    {
        return $this->hasMany(Hazard::class)->orderByRaw('sort_order is null')->orderBy('sort_order')->orderBy('time_start');
    }

    /**
     * @return HasMany<HazardSimulatorAttempt, $this>
     */
    public function attempts(): HasMany
    {
        return $this->hasMany(HazardSimulatorAttempt::class);
    }

    /**
     * @param  Builder<HazardSimulator>  $query
     * @return Builder<HazardSimulator>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
