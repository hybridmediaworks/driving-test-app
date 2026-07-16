<?php

namespace App\Actions\Quiz;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GenerateUniqueSlug
{
    public function __invoke(string $table, string $source, ?int $ignoreId = null): string
    {
        $base = Str::slug($source);
        $slug = $base;
        $suffix = 1;

        while (
            DB::table($table)
                ->where('slug', $slug)
                ->when($ignoreId !== null, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
