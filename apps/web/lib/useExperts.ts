"use client";

import { useEffect, useState } from "react";
import type { ExpertSummary } from "@driving-test-app/shared";
import { api } from "@/lib/api";

// The roster is tiny and site-wide, so one shared in-flight promise is enough (cf. phaseLadder.ts's
// per-combination Map).
let cache: Promise<ExpertSummary[]> | null = null;

function loadExperts(): Promise<ExpertSummary[]> {
  if (!cache) {
    cache = api
      .get<{ experts: ExpertSummary[] }>("/experts")
      .then((res) => res.experts)
      .catch((err) => {
        cache = null;
        throw err;
      });
  }
  return cache;
}

/**
 * The published reviewer roster (name, credentials, last-verified date, optional photo, slug),
 * in display order — admin-managed, see apps/web/app/admin/experts. Empty while loading or if the
 * fetch fails; callers fall back to generic wording rather than blocking render.
 */
export function useExperts(): ExpertSummary[] {
  const [experts, setExperts] = useState<ExpertSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadExperts()
      .then((result) => {
        if (!cancelled) setExperts(result);
      })
      .catch(() => {
        // Leave empty — callers fall back to generic wording.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return experts;
}

/**
 * The lead reviewer shown in the compact "verified by" trust badge on state and quiz pages — the
 * first of the roster in display order. Null while loading or if the fetch failed.
 */
export function usePrimaryExpert(): ExpertSummary | null {
  return useExperts()[0] ?? null;
}

export { formatVerifiedMonth, formatVerifiedDate } from "@/lib/expert-format";
