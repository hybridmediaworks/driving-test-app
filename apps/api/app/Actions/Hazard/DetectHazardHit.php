<?php

namespace App\Actions\Hazard;

use App\Models\Hazard;
use Illuminate\Support\Collection;

/**
 * Given a click at `videoMs` and a simulator's hazards, return the one hazard whose time window
 * contains that moment — or null (a false click). Shared by the live `mark` endpoint and the
 * authoritative `GradeHazardAttempt` so the two can never disagree about what counts as a hit.
 *
 * Preference when windows overlap: a scored (in-timeline) hazard beats a demo or pool-only one,
 * then the earliest-opening window wins. Demo and pool-only windows still "absorb" a click (they
 * are real hazards, just not scored) so spotting one is never punished as a false click.
 */
class DetectHazardHit
{
    /**
     * @param  Collection<int, Hazard>  $hazards
     */
    public function __invoke(Collection $hazards, int $videoMs): ?Hazard
    {
        $scorable = fn (Hazard $h): int => $h->in_timeline && $h->mode === 'assessment' ? 1 : 0;

        return $hazards
            ->filter(fn (Hazard $h) => $videoMs >= (int) round($h->time_start * 1000)
                && $videoMs <= (int) round($h->time_end * 1000))
            // A scored (in-timeline assessment) hazard wins over a demo / pool-only one; then the
            // earliest-opening window. PHP 8's sort is stable, so equal keys keep input order.
            ->sort(fn (Hazard $a, Hazard $b) => ($scorable($b) <=> $scorable($a))
                ?: ($a->time_start <=> $b->time_start))
            ->first();
    }
}
