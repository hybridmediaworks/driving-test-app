<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class State extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'agency_name',
        'dmv_website_url',
        'permit_test_fee_cents',
        'retake_wait_days',
        'supervised_driving_hours',
        'minimum_permit_age',
        'test_language_count',
        'online_testing_available',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'permit_test_fee_cents' => 'integer',
            'retake_wait_days' => 'integer',
            'supervised_driving_hours' => 'integer',
            'minimum_permit_age' => 'integer',
            'test_language_count' => 'integer',
            'online_testing_available' => 'boolean',
        ];
    }

    /**
     * @return HasMany<Quiz, $this>
     */
    public function quizzes(): HasMany
    {
        return $this->hasMany(Quiz::class);
    }

    /**
     * @return HasMany<Handbook, $this>
     */
    public function handbooks(): HasMany
    {
        return $this->hasMany(Handbook::class);
    }

    /**
     * @return HasMany<Video, $this>
     */
    public function videos(): HasMany
    {
        return $this->hasMany(Video::class);
    }

    /**
     * @return HasMany<Flashcard, $this>
     */
    public function flashcards(): HasMany
    {
        return $this->hasMany(Flashcard::class);
    }

    /**
     * @return HasMany<CheatSheet, $this>
     */
    public function cheatSheets(): HasMany
    {
        return $this->hasMany(CheatSheet::class);
    }
}
