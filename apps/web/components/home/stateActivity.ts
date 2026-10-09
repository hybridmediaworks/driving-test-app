export const DRIVERS_PRACTICING_NOW = 275_840;
export const STATES_ACTIVE_TODAY = 50;
export const DRIVERS_PASSED_TOTAL = "1.8M+";

export type ActivityBucket = {
  label: string;
  color: string;
  min: number;
};

export const activityBuckets: ActivityBucket[] = [
  { label: "Very High", color: "#2563eb", min: 80 },
  { label: "High", color: "#60a5fa", min: 60 },
  { label: "Medium", color: "#93c5fd", min: 40 },
  { label: "Low", color: "#bfdbfe", min: 20 },
  { label: "Very Low", color: "#dbeafe", min: 0 },
];

export type StateActivity = {
  name: string;
  intensity: number;
  practicing: number;
  trend: number;
  pin?: [number, number];
};

const INTENSITY: Record<string, number> = {
  Alabama: 64,
  Alaska: 12,
  Arizona: 89,
  Arkansas: 37,
  California: 95,
  Colorado: 53,
  Connecticut: 41,
  Delaware: 27,
  "District of Columbia": 68,
  Florida: 76,
  Georgia: 58,
  Hawaii: 15,
  Idaho: 33,
  Illinois: 82,
  Indiana: 46,
  Iowa: 21,
  Kansas: 39,
  Kentucky: 57,
  Louisiana: 44,
  Maine: 18,
  Maryland: 71,
  Massachusetts: 84,
  Michigan: 66,
  Minnesota: 52,
  Mississippi: 29,
  Missouri: 61,
  Montana: 11,
  Nebraska: 25,
  Nevada: 74,
  "New Hampshire": 19,
  "New Jersey": 88,
  "New Mexico": 36,
  "New York": 97,
  "North Carolina": 69,
  "North Dakota": 13,
  Ohio: 78,
  Oklahoma: 42,
  Oregon: 55,
  Pennsylvania: 91,
  "Rhode Island": 22,
  "South Carolina": 63,
  "South Dakota": 14,
  Tennessee: 59,
  Texas: 93,
  Utah: 38,
  Vermont: 17,
  Virginia: 80,
  Washington: 86,
  "West Virginia": 24,
  Wisconsin: 47,
  Wyoming: 10,
  "Puerto Rico": 72,
};

const PINS: Record<string, [number, number]> = {
  Washington: [-120.4, 47.4],
  California: [-119.4, 36.8],
  Arizona: [-111.6, 34.3],
  Texas: [-99.3, 31.3],
  Minnesota: [-94.3, 46.3],
  Missouri: [-92.5, 38.4],
  Illinois: [-89.2, 40.0],
  Ohio: [-82.8, 40.3],
  Georgia: [-83.4, 32.7],
  Florida: [-81.7, 28.1],
  Virginia: [-78.8, 37.6],
  "New York": [-75.5, 42.9],
};

const entries = Object.entries(INTENSITY);
const totalIntensity = entries.reduce((sum, [, intensity]) => sum + intensity, 0);
const maxIntensity = Math.max(...entries.map(([, intensity]) => intensity));

export const stateActivity: StateActivity[] = entries.map(([name, intensity]) => ({
  name,
  intensity,
  practicing: Math.round((intensity / totalIntensity) * DRIVERS_PRACTICING_NOW),
  trend: Math.round(intensity / 8),
  pin: PINS[name],
}));

/** Bucket fill for a state, normalized against the busiest one so buckets stay meaningful. */
export function activityColor(intensity: number): string {
  const normalized = (intensity / maxIntensity) * 100;
  const bucket = activityBuckets.find((b) => normalized >= b.min);
  return (bucket ?? activityBuckets[activityBuckets.length - 1]).color;
}

export const numberFormat = new Intl.NumberFormat("en-US");
