"use client";

import { useEffect, useState } from "react";
import { useWebLayout } from "@/lib/web-layout-context";
import { stateAbbreviations } from "@/lib/usStates";
import { api } from "@/lib/api";

export type StateStats = {
  active_today: number;
  students_practiced_30d: number;
  questions_answered_total: number;
  avg_session_seconds: number | null;
  peak_hour: number | null;
};

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

/**
 * Real, live-computed activity numbers for the current state/vehicle — GET /states/{code}/stats.
 * Deliberately no client-side fallback/placeholder numbers: while real traffic is low these
 * genuinely read small, which is the honest state of things rather than a bug to paper over.
 */
export function useStateStats(): StateStats | null {
  const { selectedState, selectedVehicle } = useWebLayout();
  const [stats, setStats] = useState<StateStats | null>(null);

  const stateCode = stateAbbreviations[selectedState];
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";

  useEffect(() => {
    if (!stateCode) return;

    let cancelled = false;

    api
      .get<{ stats: StateStats }>(`/states/${stateCode}/stats?vehicle_type=${vehicleType}`)
      .then((res) => {
        if (!cancelled) setStats(res.stats);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });

    return () => {
      cancelled = true;
    };
  }, [stateCode, vehicleType]);

  return stats;
}
