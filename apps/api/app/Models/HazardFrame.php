<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A single keyframe of a moving hazard outline. Not populated in this build — see the migration.
 */
class HazardFrame extends Model
{
    use HasFactory;

    protected $fillable = [
        'hazard_id',
        't',
        'box',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            't' => 'float',
            'box' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Hazard, $this>
     */
    public function hazard(): BelongsTo
    {
        return $this->belongsTo(Hazard::class);
    }
}
