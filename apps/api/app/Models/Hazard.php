<?php

namespace App\Models;

use App\Enums\HazardType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Hazard extends Model
{
    use HasFactory;

    protected $fillable = [
        'hazard_simulator_id',
        'source_hazard_id',
        'type_raw',
        'type',
        'hazard_group',
        'mode',
        'in_timeline',
        'sort_order',
        'time_start',
        'time_end',
        'frame_count',
        'box',
        'comment',
        'audio_url',
        'audio_disk',
        'audio_path',
    ];

    protected function casts(): array
    {
        return [
            'type' => HazardType::class,
            'in_timeline' => 'boolean',
            'time_start' => 'float',
            'time_end' => 'float',
            'frame_count' => 'integer',
            'box' => 'array',
        ];
    }

    /**
     * @return BelongsTo<HazardSimulator, $this>
     */
    public function hazardSimulator(): BelongsTo
    {
        return $this->belongsTo(HazardSimulator::class);
    }

    /**
     * @return HasMany<HazardFrame, $this>
     */
    public function frames(): HasMany
    {
        return $this->hasMany(HazardFrame::class)->orderBy('sort_order');
    }

    /** Is this hazard taught (highlighted + narrated + auto-credited) rather than scored? */
    public function isDemo(): bool
    {
        return $this->mode === 'demo';
    }

    /** The static region the player highlights — authored `box`, else a category fallback zone. */
    public function resolvedBox(): array
    {
        return $this->box ?: $this->type->defaultZone();
    }

    /** Playable narration URL — external `audio_url`, or a re-hosted disk+path if one was set. */
    public function narrationUrl(): ?string
    {
        if ($this->audio_url) {
            return $this->audio_url;
        }

        return $this->audio_disk && $this->audio_path
            ? Storage::disk($this->audio_disk)->url($this->audio_path)
            : null;
    }

    /**
     * @param  Builder<Hazard>  $query
     * @return Builder<Hazard>
     */
    public function scopeScored(Builder $query): Builder
    {
        return $query->where('in_timeline', true);
    }

    /**
     * @param  Builder<Hazard>  $query
     * @return Builder<Hazard>
     */
    public function scopeDemo(Builder $query): Builder
    {
        return $query->where('mode', 'demo');
    }
}
