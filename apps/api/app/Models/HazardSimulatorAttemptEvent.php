<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HazardSimulatorAttemptEvent extends Model
{
    use HasFactory;

    public const KIND_HIT = 'hit';

    public const KIND_MISS = 'miss';

    public const KIND_FALSE_CLICK = 'false_click';

    protected $fillable = [
        'hazard_simulator_attempt_id',
        'hazard_id',
        'kind',
        'clicked_at_video_ms',
        'reaction_ms',
        'pointer_x',
        'pointer_y',
    ];

    protected function casts(): array
    {
        return [
            'clicked_at_video_ms' => 'integer',
            'reaction_ms' => 'integer',
            'pointer_x' => 'float',
            'pointer_y' => 'float',
        ];
    }

    /**
     * @return BelongsTo<HazardSimulatorAttempt, $this>
     */
    public function attempt(): BelongsTo
    {
        return $this->belongsTo(HazardSimulatorAttempt::class, 'hazard_simulator_attempt_id');
    }

    /**
     * @return BelongsTo<Hazard, $this>
     */
    public function hazard(): BelongsTo
    {
        return $this->belongsTo(Hazard::class);
    }
}
