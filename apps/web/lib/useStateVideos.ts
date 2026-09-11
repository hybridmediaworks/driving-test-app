"use client";

import { useEffect, useState } from "react";
import type { PaginatedResponse, PublicVideo } from "@driving-test-app/shared";
import { api } from "@/lib/api";
import { stateAbbreviations } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

/** Shared in-flight/resolved cache, keyed by the filters — same pattern as lib/useResolvedQuiz.ts. */
const cache = new Map<string, Promise<PublicVideo[]>>();

/**
 * Videos published for the current state and vehicle, in admin order. Empty while loading or if
 * the fetch fails, so callers can render nothing rather than a placeholder.
 */
export function useStateVideos(limit: number): PublicVideo[] {
  const { selectedState, selectedVehicle } = useWebLayout();
  const stateCode = stateAbbreviations[selectedState] ?? "";
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";
  const key = `${stateCode}|${vehicleType}|${limit}`;

  const [videos, setVideos] = useState<PublicVideo[]>([]);

  useEffect(() => {
    if (!stateCode) return;
    let cancelled = false;

    let promise = cache.get(key);
    if (!promise) {
      promise = api
        // Ask for more than we show so the free ones can be floated to the front below — a
        // preview strip full of locked clips has nothing to preview.
        .get<PaginatedResponse<PublicVideo>>(
          `/videos?state=${stateCode}&vehicle_type=${vehicleType}&per_page=${limit * 4}`,
        )
        .then((res) => {
          const free = res.data.filter((video) => !video.locked);
          const locked = res.data.filter((video) => video.locked);
          return [...free, ...locked].slice(0, limit);
        })
        .catch(() => []);
      cache.set(key, promise);
    }

    promise.then((result) => {
      if (!cancelled) setVideos(result);
    });

    return () => {
      cancelled = true;
    };
  }, [stateCode, vehicleType, limit, key]);

  return videos;
}
