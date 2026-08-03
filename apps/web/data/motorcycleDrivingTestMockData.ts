import rawSections from "./motorcycledrivingtestmockdata.json";
import type { DrivingTestSection } from "./drivingTestMockData";

export type { DrivingTestCard, DrivingTestCardGroup, DrivingTestSection } from "./drivingTestMockData";

/**
 * Stand-in for a real endpoint (e.g. `api.get<DrivingTestSection[]>(`/states/${state}/motorcycle/driving-test-sections`)`).
 * No backend exists yet for the motorcycle Driving Test track, so this resolves to
 * motorcycledrivingtestmockdata.json - callers already treat it as async so swapping the body in later
 * (e.g. `return api.get(...)`) is a one-line change.
 */
export async function fetchMotorcycleDrivingTestSections(): Promise<
  DrivingTestSection[]
> {
  return rawSections as DrivingTestSection[];
}
