export type AdminStats = {
  users: {
    total: number;
    admins: number;
    verified: number;
    new_last_7_days: number;
  };
  quizzes: {
    total: number;
    active: number;
    categories: number;
    questions: number;
  };
  attempts: {
    total: number;
    completed: number;
    in_progress: number;
    average_score: number | null;
    last_7_days: number;
  };
  content: {
    flashcards: {
      total: number;
      active: number;
      premium: number;
      reviews: number;
    };
    cheat_sheets: {
      total: number;
      active: number;
      premium: number;
    };
  };
};
