<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HandbookSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'handbook_chapter_id',
        'heading',
        'content',
        'sort_order',
    ];

    /**
     * @return BelongsTo<HandbookChapter, $this>
     */
    public function chapter(): BelongsTo
    {
        return $this->belongsTo(HandbookChapter::class, 'handbook_chapter_id');
    }
}
