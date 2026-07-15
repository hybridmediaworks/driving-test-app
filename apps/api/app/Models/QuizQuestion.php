<?php

namespace App\Models;

use App\Enums\QuestionDifficulty;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuizQuestion extends Model
{
    protected $fillable = [
        'quiz_id',
        'question_text',
        'explanation',
        'difficulty',
        'topic',
        'sort_order',
        'images',
    ];

    protected $appends = [
        'image_urls',
    ];

    protected function casts(): array
    {
        return [
            'difficulty' => QuestionDifficulty::class,
            'images' => 'array',
        ];
    }

    /**
     * Public URLs for stored image paths (disk `public`).
     *
     * Uses the current request host when available so previews work on Laragon
     * or other hosts even when APP_URL in .env still says http://localhost.
     *
     * @return Attribute<list<string>, never>
     */
    protected function imageUrls(): Attribute
    {
        return Attribute::get(function (): array {
            $paths = $this->images ?? [];

            return array_values(array_filter(array_map(
                function (?string $path): ?string {
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
                },
                $paths,
            )));
        });
    }

    /**
     * @return BelongsTo<Quiz, $this>
     */
    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    /**
     * @return HasMany<QuizAnswer, $this>
     */
    public function answers(): HasMany
    {
        return $this->hasMany(QuizAnswer::class)->orderBy('sort_order');
    }
}
