<?php

namespace App\Actions\Hazard;

use App\Enums\HazardAttemptStatus;
use App\Models\HazardSimulator;
use App\Models\HazardSimulatorAttempt;

/**
 * Opens the `in_progress` row a run is graded into later. Unlike a quiz, a hazard run is one
 * continuous timed clip — there is no meaningful "resume from the middle" — so this doesn't try to
 * reattach to an old attempt. It does fold a very fresh in-progress attempt back in (a double
 * Start from a fast reload within `REUSE_WITHIN_SECONDS`) to avoid orphan rows, unless `forceNew`.
 */
class StartHazardSimulatorAttempt
{
    private const REUSE_WITHIN_SECONDS = 90;

    public function __invoke(
        HazardSimulator $simulator,
        ?int $userId,
        ?string $guestToken,
        bool $forceNew = false,
    ): HazardSimulatorAttempt {
        if (! $forceNew && ($userId !== null || $guestToken !== null)) {
            $recent = HazardSimulatorAttempt::query()
                ->where('hazard_simulator_id', $simulator->id)
                ->where('status', HazardAttemptStatus::InProgress)
                ->where('created_at', '>=', now()->subSeconds(self::REUSE_WITHIN_SECONDS))
                ->when(
                    $userId !== null,
                    fn ($q) => $q->where('user_id', $userId),
                    fn ($q) => $q->where('guest_token', $guestToken),
                )
                ->latest('id')
                ->first();

            if ($recent !== null) {
                return $recent;
            }
        }

        return HazardSimulatorAttempt::query()->create([
            'user_id' => $userId,
            'guest_token' => $userId === null ? $guestToken : null,
            'hazard_simulator_id' => $simulator->id,
            'status' => HazardAttemptStatus::InProgress,
            'hazards_total' => $simulator->hazards()->scored()->where('mode', 'assessment')->count(),
            'started_at' => now(),
        ]);
    }

    /**
     * The caller's own still-open attempt with this id on this simulator, or null. Guards the
     * `mark` and `submit` endpoints the same way StartOrResumeQuizAttempt::findOwned does.
     */
    public function findOwned(int $attemptId, HazardSimulator $simulator, ?int $userId, ?string $guestToken): ?HazardSimulatorAttempt
    {
        return HazardSimulatorAttempt::query()
            ->where('id', $attemptId)
            ->where('hazard_simulator_id', $simulator->id)
            ->where('status', HazardAttemptStatus::InProgress)
            ->when(
                $userId !== null,
                fn ($q) => $q->where('user_id', $userId),
                fn ($q) => $q->where('guest_token', $guestToken),
            )
            ->first();
    }
}
