import rawPhases from "./motorcyclestepsmockdata.json";
import type { StepsMockPhase } from "./stepsMockData";

export type { StepsMockPhase };

/**
 * Stand-in for a real endpoint (e.g. `api.get<StepsMockPhase[]>(`/states/${state}/motorcycle/steps`)`).
 * No backend exists yet for the motorcycle landing page's step phases, so this resolves to
 * motorcyclestepsmockdata.json - callers already treat it as async so swapping the body in later
 * (e.g. `return api.get(...)`) is a one-line change.
 */
export async function fetchMotorcycleSteps(): Promise<StepsMockPhase[]> {
  return rawPhases as StepsMockPhase[];
}
