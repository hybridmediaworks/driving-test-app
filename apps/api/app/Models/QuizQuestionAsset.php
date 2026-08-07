<?php

namespace App\Models;

use App\Enums\QuizQuestionAssetType;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class QuizQuestionAsset extends Model
{
    use HasFactory;

    protected $fillable = [
        'quiz_question_id',
        'type',
        'external_url',
        'disk',
        'path',
        'duration_seconds',
        'sort_order',
    ];

    protected $appends = [
        'url',
    ];

    protected function casts(): array
    {
        return [
            'type' => QuizQuestionAssetType::class,
        ];
    }

    /**
     * @return BelongsTo<QuizQuestion, $this>
     */
    public function quizQuestion(): BelongsTo
    {
        return $this->belongsTo(QuizQuestion::class);
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function url(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->external_url
            ?? ($this->disk && $this->path ? Storage::disk($this->disk)->url($this->path) : null));
    }
}
