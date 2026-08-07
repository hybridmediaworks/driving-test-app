<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HandbookChapter extends Model
{
    use HasFactory;

    protected $fillable = [
        'handbook_id',
        'title',
        'sort_order',
    ];

    /**
     * @return BelongsTo<Handbook, $this>
     */
    public function handbook(): BelongsTo
    {
        return $this->belongsTo(Handbook::class);
    }

    /**
     * @return HasMany<HandbookSection, $this>
     */
    public function sections(): HasMany
    {
        return $this->hasMany(HandbookSection::class)->orderBy('sort_order');
    }
}
