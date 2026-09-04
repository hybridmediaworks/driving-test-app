"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserProgress } from "@driving-test-app/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { stateAbbreviations } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

/**
 * The signed-in learner's progress for the state/vehicle/track currently being viewed — the data
 * behind the state hub's sidebar (GET /me/progress). Null while loading, for signed-out visitors,
 * or if the request fails; callers render nothing rather than guessing at numbers.
 *
 * What's fetched is stored together with the key it was fetched for, and only handed back when
 * that key still matches. That way switching state, vehicle, track or account never briefly shows
 * the previous combination's numbers, and signing out clears the panel without the hook having to
 * write state from inside an effect.
 *
 * `reload` re-fetches without a full page navigation — used after the learner changes their exam
 * date, and available for any other action that should refresh the panel.
 */
export function useLearnerProgress(): {
  progress: UserProgress | null;
  loading: boolean;
  reload: () => void;
} {
  const { user } = useAuth();
  const { selectedState, selectedVehicle, selectedTestType } = useWebLayout();
  const [entry, setEntry] = useState<{ key: string; data: UserProgress } | null>(
    null,
  );
  const [nonce, setNonce] = useState(0);

  const stateCode = stateAbbreviations[selectedState];
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";
  const userId = user?.id ?? null;

  const key =
    userId && stateCode
      ? `${userId}:${stateCode}:${vehicleType}:${selectedTestType}`
      : null;

  useEffect(() => {
    if (!key || !stateCode) return;

    let cancelled = false;

    const params = new URLSearchParams({
      state: stateCode,
      vehicle_type: vehicleType,
      test_track: selectedTestType,
    });

    api
      .get<UserProgress>(`/me/progress?${params.toString()}`)
      .then((result) => {
        if (!cancelled) setEntry({ key, data: result });
      })
      .catch(() => {
        // Unverified email, a network blip, anything — the sidebar simply doesn't render.
      });

    return () => {
      cancelled = true;
    };
  }, [key, stateCode, vehicleType, selectedTestType, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    progress: key && entry?.key === key ? entry.data : null,
    // Derived rather than tracked: there is a fetch to wait for exactly when we have a key but no
    // matching result yet. A failed request stays "loading" and the panel stays hidden, which is
    // the same outcome either way.
    loading: Boolean(key) && entry?.key !== key,
    reload,
  };
}
