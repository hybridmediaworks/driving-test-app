<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CheatSheetSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'cheat_sheet_id',
        'heading',
        'body_markdown',
        'sort_order',
    ];

    /**
     * @return BelongsTo<CheatSheet, $this>
     */
    public function cheatSheet(): BelongsTo
    {
        return $this->belongsTo(CheatSheet::class);
    }
}
