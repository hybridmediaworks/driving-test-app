<?php

namespace App\Rules;

use App\Support\DisposableEmail\DisposableMailServers;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Propaganistas\LaravelDisposableEmail\Facades\DisposableDomains;

class NotDisposableEmail implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            return;
        }

        if (DisposableDomains::isDisposable($value, checkMx: true) || app(DisposableMailServers::class)->isDisposable($value)) {
            $fail('validation.indisposable')->translate();
        }
    }
}
