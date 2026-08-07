<?php

namespace App\Support;

/**
 * Shared by the video and simulator crawl-importers — source formats embed duration as free text
 * rather than a structured seconds field, in one of two real formats seen on the site: "2:15 min"
 * (simulators' `test_length`, and some videos' title suffix) or "19m 21s" (other videos' own
 * `video-length` field, e.g. the motorcycle "Learn to Ride" set).
 */
class DurationParser
{
    public static function fromMinSecString(?string $text): ?int
    {
        if ($text === null) {
            return null;
        }

        if (preg_match('/(\d+):(\d{2})\s*min/i', $text, $matches)) {
            return ((int) $matches[1] * 60) + (int) $matches[2];
        }

        if (preg_match('/(\d+)\s*m\s+(\d+)\s*s\b/i', $text, $matches)) {
            return ((int) $matches[1] * 60) + (int) $matches[2];
        }

        return null;
    }
}
