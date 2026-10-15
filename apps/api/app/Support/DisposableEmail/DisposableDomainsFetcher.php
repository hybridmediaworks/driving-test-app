<?php

namespace App\Support\DisposableEmail;

use Illuminate\Support\Facades\Http;
use Propaganistas\LaravelDisposableEmail\Contracts\Fetcher;
use UnexpectedValueException;

class DisposableDomainsFetcher implements Fetcher
{
    public function handle($url): array
    {
        $data = Http::timeout(60)->get($url)->throw()->json();

        $domains = is_array($data) && array_is_list($data)
            ? $data
            : array_keys($data['domains'] ?? []);

        if ($domains === []) {
            throw new UnexpectedValueException("No disposable domains found at {$url}");
        }

        return $domains;
    }
}
