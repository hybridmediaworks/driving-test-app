export type UserStats = {
  attempts: {
    total: number;
    completed: number;
    in_progress: number;
    passed: number;
    average_score: number | null;
    last_7_days: number;
  };
  flashcards: {
    total_active: number;
    known: number;
    unknown: number;
  };
  cheat_sheets: {
    total_active: number;
  };
};
