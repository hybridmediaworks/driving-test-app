export type UserStats = {
  attempts: {
    total: number;
    completed: number;
    in_progress: number;
    passed: number;
    average_score: number | null;
    last_7_days: number;
    recent_scores: number[];
  };
  flashcards: {
    total_active: number;
    known: number;
    unknown: number;
  };
  cheat_sheets: {
    total_active: number;
  };
  categories: {
    id: number;
    name: string;
    average_score: number;
    attempts_count: number;
  }[];
};

/**
 * GET /me/progress — the learner's own study progress for one state/vehicle/track, as shown in
 * the state hub's sidebar. Every figure is derived from recorded quiz attempts.
 */
export type UserProgress = {
  /** Distinct quizzes completed at least once, over how many exist in this scope. */
  tests: { completed: number; total: number };
  /** Distinct questions answered at least once, over how many exist in this scope. */
  questions: {
    covered: number;
    total: number;
    /** Per-quiz coverage keyed by quiz slug. A quiz never started is absent, not zero. */
    by_quiz: Record<string, number>;
  };
  streak: {
    /** Consecutive days ending today or yesterday that hit `daily_target`. */
    current: number;
    daily_target: number;
    answered_today: number;
    /** The most recent few days, oldest first — one entry per streak dot. */
    days: { date: string; answered: number; met: boolean }[];
  };
};
