import rawSections from "./drivingtestmockdata.json";

export type DrivingTestCard = {
  title?: string;
  total?: string;
  duration?: string;
  status?: string;
  type?: "free" | "premium";
  image?: string;
  variant?: "trophy";
};

export type DrivingTestCardGroup = {
  title?: string;
  cards: DrivingTestCard[];
};

export type DrivingTestSection = {
  id: string;
  cardType: "image" | "video";
  columns?: number;
  header: {
    title: string;
    description?: string;
    countLabel?: string;
  };
  groups: DrivingTestCardGroup[];
};

/**
 * Stand-in for a real endpoint (e.g. `api.get<DrivingTestSection[]>(`/states/${state}/driving-test-sections`)`).
 * No backend exists yet for the Driving Test track, so this resolves to
 * drivingtestmockdata.json - callers already treat it as async so swapping the body in later
 * (e.g. `return api.get(...)`) is a one-line change.
 */
export async function fetchDrivingTestSections(): Promise<
  DrivingTestSection[]
> {
  return rawSections as DrivingTestSection[];
}
