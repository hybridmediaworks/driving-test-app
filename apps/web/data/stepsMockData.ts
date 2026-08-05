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
  completed?: boolean;
  /** True only on the step the user finished in this session — tells the UI to
   * animate the fill (this step + its trailing connector) instead of rendering
   * the completed state directly. The frontend acks it back to the backend
   * after playing the animation once, so it never replays on a later reload. */
  justCompleted?: boolean;
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
