<?php

namespace App\Models;

use App\Enums\HazardAttemptStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HazardSimulatorAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'guest_token',
        'hazard_simulator_id',
        'status',
        'score',
        'passed',
        'hazards_spotted',
        'hazards_total',
        'avg_reaction_ms',
        'reaction_band',
        'false_clicks',
        'started_at',
        'completed_at',
        'duration_seconds',
    ];

    protected function casts(): array
    {
        return [
            'status' => HazardAttemptStatus::class,
            'passed' => 'boolean',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<HazardSimulator, $this>
     */
    public function hazardSimulator(): BelongsTo
    {
        return $this->belongsTo(HazardSimulator::class);
    }

    /**
     * @return HasMany<HazardSimulatorAttemptEvent, $this>
     */
    public function events(): HasMany
    {
        return $this->hasMany(HazardSimulatorAttemptEvent::class);
    }

    /**
     * Eager-load set for rendering an attempt with its full per-hazard review data — shared by the
     * self-service and admin listings so they stay in sync (mirrors QuizAttempt::withReviewDetails).
     *
     * @param  Builder<HazardSimulatorAttempt>  $query
     * @return Builder<HazardSimulatorAttempt>
     */
    public function scopeWithReviewDetails(Builder $query): Builder
    {
        return $query->with([
            'hazardSimulator.video',
            'hazardSimulator.hazards',
            'events.hazard',
        ]);
    }
}
