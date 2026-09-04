<?php

/**
 * Hazard Perception scoring calibration — see docs/HAZARD_PERCEPTION_SIMULATOR.md §6.
 *
 * GradeHazardAttempt reads the profile named by `hazard_simulators.scoring_profile` (falling back
 * to `default_profile`). Every knob lives here so staff can tune the feel of the score without a
 * code release. Seeded against the two observed reference runs:
 *   3/6 spotted · 424 ms (Fast)    · 15 false clicks  → ~36%
 *   5/6 spotted · 1497 ms (Average) · 22 false clicks → ~55%
 */

return [
    'default_profile' => 'standard',

    'profiles' => [
        'standard' => [
            // Composite: score = 100 · (detection_weight·detection + reaction_weight·reaction) · (1 − penalty)
            'detection_weight' => 0.70,
            'reaction_weight' => 0.30,

            // False-click penalty: penalty = min(false_clicks · per_false_click, max_penalty)
            'per_false_click' => 0.02,
            'max_penalty' => 0.30,

            // avg_reaction_ms → band. `fast` when < fast_ms, `average` when < average_ms, else `slow`.
            'reaction_bands' => [
                'fast_ms' => 700,
                'average_ms' => 1500,
            ],

            // Anti-cheat guards (all thresholds live here).
            'min_click_gap_ms' => 250,     // ignore a click within this of the previous one
            'max_counted_clicks' => 400,   // hard ceiling on clicks the grader will process at all
            // A fast run of near-perfectly evenly spaced clicks (std-dev / mean of the gaps below
            // the threshold, mean gap under the ceiling, at least this many clicks) reads as
            // metronomic spam → all hazard credit for the run is voided and every click is a miss.
            'metronome_min_clicks' => 8,
            'metronome_cv_threshold' => 0.12,
            'metronome_max_mean_gap_ms' => 1800,
        ],
    ],
];
