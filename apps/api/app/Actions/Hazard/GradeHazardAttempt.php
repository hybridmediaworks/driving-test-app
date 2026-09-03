<?php

namespace App\Actions\Hazard;

use App\Enums\HazardAttemptStatus;
use App\Models\Hazard;
use App\Models\HazardSimulator;
use App\Models\HazardSimulatorAttempt;
use App\Models\HazardSimulatorAttemptEvent;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Server-authoritative Hazard Score. The client submits the raw click log `[{video_ms, x, y}]`;
 * this recomputes everything in a transaction and never trusts a client number — same rule as
 * GradeQuizAttempt. See docs/HAZARD_PERCEPTION_SIMULATOR.md §6. Every weight, band and guard comes
 * from config/hazard.php keyed by the simulator's `scoring_profile`, so calibration is a config
 * edit, not a release.
 */
class GradeHazardAttempt
{
    public function __construct(
        private readonly DetectHazardHit $detectHit,
        private readonly StartHazardSimulatorAttempt $starter,
    ) {}

    /**
     * @param  list<array{video_ms?: int|string, x?: float|string|null, y?: float|string|null}>  $rawEvents
     */
    public function __invoke(
        HazardSimulator $simulator,
        array $rawEvents,
        ?int $userId,
        ?string $guestToken,
        ?int $durationSeconds,
        ?int $attemptId = null,
    ): HazardSimulatorAttempt {
        return DB::transaction(function () use ($simulator, $rawEvents, $userId, $guestToken, $durationSeconds, $attemptId): HazardSimulatorAttempt {
            $profile = self::profile($simulator);

            $hazards = $simulator->hazards()->get();
            $scored = $hazards->where('in_timeline', true)->where('mode', 'assessment')->values();
            $autoCredited = $hazards->where('in_timeline', true)->where('mode', 'demo')->values();
            $total = $scored->count();

            $clicks = $this->normalizeClicks($rawEvents, (int) $profile['min_click_gap_ms'], (int) $profile['max_counted_clicks']);
            $metronomic = $this->isMetronomic($clicks->pluck('video_ms')->all(), $profile);

            /** @var array<int, array{click: array, reaction_ms: int, window_ms: int}> $hits */
            $hits = [];
            /** @var list<array{video_ms: int, x: float|null, y: float|null}> $falseClicks */
            $falseClicks = [];

            foreach ($clicks as $click) {
                $hazard = ($this->detectHit)($hazards, $click['video_ms']);

                if ($hazard === null) {
                    $falseClicks[] = $click;

                    continue;
                }

                // A demo or pool-only window absorbs the click — a real hazard, just not scored.
                if (! $hazard->in_timeline || $hazard->mode !== 'assessment' || isset($hits[$hazard->id])) {
                    continue;
                }

                $windowMs = max(1, (int) round(((float) $hazard->time_end - (float) $hazard->time_start) * 1000));
                $reaction = max(0, min($windowMs, $click['video_ms'] - (int) round((float) $hazard->time_start * 1000)));
                $hits[$hazard->id] = ['click' => $click, 'reaction_ms' => $reaction, 'window_ms' => $windowMs];
            }

            if ($metronomic) {
                $falseClicks = $clicks->all();
                $hits = [];
            }

            $spotted = count($hits);
            $falseCount = count($falseClicks);

            $detection = $total > 0 ? $spotted / $total : 1.0;

            $reactionScores = array_map(fn ($h) => 1 - ($h['reaction_ms'] / $h['window_ms']), $hits);
            $reactionScore = $reactionScores === [] ? 0.0 : array_sum($reactionScores) / count($reactionScores);
            $reactionMs = array_map(fn ($h) => $h['reaction_ms'], $hits);
            $avgReactionMs = $reactionMs === [] ? null : (int) round(array_sum($reactionMs) / count($reactionMs));

            $penalty = min($falseCount * (float) $profile['per_false_click'], (float) $profile['max_penalty']);
            $composite = ((float) $profile['detection_weight'] * $detection) + ((float) $profile['reaction_weight'] * $reactionScore);
            $score = (int) max(0, min(100, round(100 * $composite * (1 - $penalty))));

            $attempt = ($attemptId !== null ? $this->starter->findOwned($attemptId, $simulator, $userId, $guestToken) : null)
                ?? HazardSimulatorAttempt::query()->create([
                    'user_id' => $userId,
                    'guest_token' => $userId === null ? $guestToken : null,
                    'hazard_simulator_id' => $simulator->id,
                    'status' => HazardAttemptStatus::InProgress,
                    'started_at' => now(),
                ]);

            $threshold = $simulator->pass_threshold_percent;

            $attempt->update([
                'status' => HazardAttemptStatus::Completed,
                'score' => $score,
                'passed' => $threshold === null ? null : $score >= $threshold,
                'hazards_spotted' => $spotted,
                'hazards_total' => $total,
                'avg_reaction_ms' => $avgReactionMs,
                'reaction_band' => self::band($avgReactionMs, $profile),
                'false_clicks' => $falseCount,
                'completed_at' => now(),
                'duration_seconds' => $durationSeconds,
            ]);

            $this->writeEvents($attempt, $scored, $autoCredited, $hits, $falseClicks);

            return $attempt->load(['events.hazard', 'hazardSimulator.video', 'hazardSimulator.hazards']);
        });
    }

    /**
     * Sort, drop too-fast repeats, and cap the raw click log.
     *
     * @param  list<array<string, mixed>>  $rawEvents
     * @return Collection<int, array{video_ms: int, x: float|null, y: float|null}>
     */
    private function normalizeClicks(array $rawEvents, int $minGapMs, int $hardCap): Collection
    {
        $sorted = collect($rawEvents)
            ->map(fn ($e) => [
                'video_ms' => max(0, (int) ($e['video_ms'] ?? 0)),
                'x' => isset($e['x']) && $e['x'] !== null ? (float) $e['x'] : null,
                'y' => isset($e['y']) && $e['y'] !== null ? (float) $e['y'] : null,
            ])
            ->sortBy('video_ms')
            ->values()
            ->take($hardCap);

        $kept = collect();
        $lastMs = null;
        foreach ($sorted as $click) {
            if ($lastMs !== null && $minGapMs > $click['video_ms'] - $lastMs) {
                continue;
            }
            $kept->push($click);
            $lastMs = $click['video_ms'];
        }

        return $kept;
    }

    /**
     * @param  list<int>  $timestamps
     * @param  array<string, mixed>  $profile
     */
    private function isMetronomic(array $timestamps, array $profile): bool
    {
        $minClicks = (int) $profile['metronome_min_clicks'];
        if (count($timestamps) < $minClicks) {
            return false;
        }

        $gaps = [];
        for ($i = 1; $i < count($timestamps); $i++) {
            $gaps[] = $timestamps[$i] - $timestamps[$i - 1];
        }

        $mean = array_sum($gaps) / count($gaps);
        if ($mean <= 0 || $mean > (float) $profile['metronome_max_mean_gap_ms']) {
            return false;
        }

        $variance = array_sum(array_map(fn ($g) => ($g - $mean) ** 2, $gaps)) / count($gaps);
        $cv = sqrt($variance) / $mean;

        return $cv < (float) $profile['metronome_cv_threshold'];
    }

    /**
     * @param  Collection<int, Hazard>  $scored
     * @param  Collection<int, Hazard>  $autoCredited
     * @param  array<int, array{click: array, reaction_ms: int, window_ms: int}>  $hits
     * @param  list<array{video_ms: int, x: float|null, y: float|null}>  $falseClicks
     */
    private function writeEvents(
        HazardSimulatorAttempt $attempt,
        Collection $scored,
        Collection $autoCredited,
        array $hits,
        array $falseClicks,
    ): void {
        $attempt->events()->delete();

        $rows = [];

        foreach ($scored as $hazard) {
            $hit = $hits[$hazard->id] ?? null;
            $rows[] = [
                'hazard_id' => $hazard->id,
                'kind' => $hit ? HazardSimulatorAttemptEvent::KIND_HIT : HazardSimulatorAttemptEvent::KIND_MISS,
                'clicked_at_video_ms' => $hit['click']['video_ms'] ?? null,
                'reaction_ms' => $hit['reaction_ms'] ?? null,
                'pointer_x' => $hit['click']['x'] ?? null,
                'pointer_y' => $hit['click']['y'] ?? null,
            ];
        }

        // Demo hazards were taught, not tested — recorded as credited hits with no reaction so the
        // review screen can show them as "shown in the walkthrough".
        foreach ($autoCredited as $hazard) {
            $rows[] = [
                'hazard_id' => $hazard->id,
                'kind' => HazardSimulatorAttemptEvent::KIND_HIT,
                'clicked_at_video_ms' => null,
                'reaction_ms' => null,
                'pointer_x' => null,
                'pointer_y' => null,
            ];
        }

        foreach ($falseClicks as $click) {
            $rows[] = [
                'hazard_id' => null,
                'kind' => HazardSimulatorAttemptEvent::KIND_FALSE_CLICK,
                'clicked_at_video_ms' => $click['video_ms'],
                'reaction_ms' => null,
                'pointer_x' => $click['x'],
                'pointer_y' => $click['y'],
            ];
        }

        $attempt->events()->createMany($rows);
    }

    /**
     * @return array<string, mixed>
     */
    public static function profile(HazardSimulator $simulator): array
    {
        $key = $simulator->scoring_profile ?: config('hazard.default_profile');
        $profiles = config('hazard.profiles');

        return $profiles[$key] ?? $profiles[config('hazard.default_profile')];
    }

    /**
     * @param  array<string, mixed>  $profile
     */
    public static function band(?int $avgReactionMs, array $profile): ?string
    {
        if ($avgReactionMs === null) {
            return null;
        }

        return match (true) {
            $avgReactionMs < (int) $profile['reaction_bands']['fast_ms'] => 'fast',
            $avgReactionMs < (int) $profile['reaction_bands']['average_ms'] => 'average',
            default => 'slow',
        };
    }
}
