<?php

namespace App\Enums;

/**
 * Lifecycle of a single hazard-perception run. Mirrors AttemptStatus (quizzes) but adds
 * `Abandoned` — a hazard run is one continuous timed video, so a learner who closes the tab
 * mid-clip leaves a row that never reaches `Completed` and, unlike a quiz, can't be meaningfully
 * resumed from the middle. Those are swept to `Abandoned` rather than lingering as `InProgress`.
 */
enum HazardAttemptStatus: string
{
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Abandoned = 'abandoned';
}
