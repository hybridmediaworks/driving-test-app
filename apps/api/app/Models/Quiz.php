<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Quiz extends Model
{
    protected $fillable = [
        'quiz_category_id',
        'quiz_type_id',
        'state_id',
        'vehicle_type_id',
        'title',
        'slug',
        'order_no',
        'cover_image_path',
        'test_track',
        'total_questions',
        'duration_seconds',
        'is_premium',
        'is_active',
    ];

    protected $appends = [
        'cover_image_url',
    ];

    protected function casts(): array
    {
        return [
            'is_premium' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::deleting(function (Quiz $quiz): void {
            if ($quiz->cover_image_path !== null && $quiz->cover_image_path !== '') {
                Storage::disk('public')->delete(
                    str_replace('\\', '/', $quiz->cover_image_path),
                );
            }
        });
    }

    /**
     * @return BelongsTo<QuizCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(QuizCategory::class, 'quiz_category_id');
    }

    /**
     * @return BelongsTo<QuizType, $this>
     */
    public function quizType(): BelongsTo
    {
        return $this->belongsTo(QuizType::class);
    }

    /**
     * @return BelongsTo<State, $this>
     */
    public function state(): BelongsTo
    {
        return $this->belongsTo(State::class);
    }

    /**
     * @return BelongsTo<VehicleType, $this>
     */
    public function vehicleType(): BelongsTo
    {
        return $this->belongsTo(VehicleType::class);
    }

    /**
     * @return HasMany<QuizQuestion, $this>
     */
    public function quizQuestions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class)->orderBy('sort_order');
    }

    public function syncTotalQuestions(): void
    {
        $this->update([
            'total_questions' => $this->quizQuestions()->count(),
        ]);
    }

    /**
     * Public URL for the cover image (disk `public`).
     *
     * @return Attribute<string|null, never>
     */
    protected function coverImageUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            $path = $this->cover_image_path;
            if ($path === null || $path === '') {
                return null;
            }

            $path = ltrim(str_replace('\\', '/', $path), '/');

            if (! app()->runningInConsole() && app()->has('request')) {
                $request = request();
                $origin = rtrim($request->getSchemeAndHttpHost(), '/');
                $appPath = parse_url((string) config('app.url'), PHP_URL_PATH);
                $appPath = is_string($appPath) ? rtrim($appPath, '/') : '';

                return ($appPath !== '' && $appPath !== '/')
                    ? $origin.$appPath.'/storage/'.$path
                    : $origin.'/storage/'.$path;
            }

            return rtrim((string) config('app.url'), '/').'/storage/'.$path;
        });
    }
}
