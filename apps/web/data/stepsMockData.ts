import rawPhases from "./stepsmockdata.json";

export type StepsMockStep = {
  step: number;
  title?: string;
  totalQuestions?: string;
  totalTime?: string;
  type?: "free" | "premium";
  image?: string;
  status?: "next";
  style?: "large";
  "quiz-valut"?: boolean;
};

export type StepsMockPhase = {
  phase: number;
  phaseStatus: string;
  header: {
    headerTitle: string;
    headerDesc: string;
    totalQuestions: string;
    totalTime: string;
    handbook?: boolean;
  };
  steps: StepsMockStep[];
};

/**
 * Stand-in for a real endpoint (e.g. `api.get<StepsMockPhase[]>(`/states/${state}/steps`)`).
 * No backend exists yet for the state landing page's step phases, so this resolves to
 * stepsmockdata.json - callers already treat it as async so swapping the body in later
 * (e.g. `return api.get(...)`) is a one-line change.
 */
export async function fetchStateSteps(): Promise<StepsMockPhase[]> {
  return rawPhases as StepsMockPhase[];
}
