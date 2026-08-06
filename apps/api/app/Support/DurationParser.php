<?php

namespace App\Support;

/**
 * Shared by the video and simulator crawl-importers — both source formats embed duration as
 * free text like "2:15 min" (a title suffix for videos, its own `test_length` field for
 * simulators) rather than a structured seconds field.
 */
class DurationParser
{
    public static function fromMinSecString(?string $text): ?int
    {
        if ($text === null || ! preg_match('/(\d+):(\d{2})\s*min/i', $text, $matches)) {
            return null;
        }

        return ((int) $matches[1] * 60) + (int) $matches[2];
    }
}
