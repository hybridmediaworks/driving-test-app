<?php

namespace App\Support;

/**
 * Mutable counter/warning collector threaded through every content:import sub-action, so a
 * 40GB-scale run surfaces exactly what happened (imported/updated/skipped per content type, plus
 * every warning) as one final report instead of silent partial failures.
 */
class ImportSummary
{
    /** @var array<string, int> */
    private array $counts = [];

    /** @var list<string> */
    private array $warnings = [];

    public function increment(string $key): void
    {
        $this->counts[$key] = ($this->counts[$key] ?? 0) + 1;
    }

    public function warn(string $message): void
    {
        $this->warnings[] = $message;
    }

    /**
     * @return array<string, int>
     */
    public function counts(): array
    {
        return $this->counts;
    }

    /**
     * @return list<string>
     */
    public function warnings(): array
    {
        return $this->warnings;
    }
}
