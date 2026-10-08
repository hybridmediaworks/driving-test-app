import type { PassGuaranteeClaimStatus } from "./billing";

export type AdminStats = {
  users: {
    total: number;
    admins: number;
    verified: number;
    new_today: number;
    new_last_7_days: number;
    daily_new_last_7_days: number[];
  };
  quizzes: {
    total: number;
    active: number;
    categories: number;
    questions: number;
    answers: number;
  };
  attempts: {
    total: number;
    completed: number;
    in_progress: number;
    average_score: number | null;
    today: number;
    last_7_days: number;
    daily_last_7_days: number[];
  };
  content: {
    states: number;
    videos: number;
    hazard_simulators: number;
    /** Question counts per vehicle type, largest first. */
    questions_by_vehicle: { name: string; questions: number }[];
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
  activity: {
    top_states_last_7_days: {
      /** The five busiest states by attempts over the window, most active first. */
      states: { code: string; name: string; total: number; daily: number[] }[];
      /** Everywhere outside the top five, combined — so the chart can say what it omits. */
      others_total: number;
    };
  };
  billing: {
    active_weekly_subscribers: number;
    active_monthly_subscribers: number;
    active_family_groups: number;
    recurring_revenue_cents: number;
    claims: Record<PassGuaranteeClaimStatus, number>;
  };
};
