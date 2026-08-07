"use client";

import { useEffect, useState } from "react";
import type { PaginatedResponse, Quiz } from "@driving-test-app/shared";
import { api } from "@/lib/api";
import { stateAbbreviations } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

/** In-flight/resolved request cache, keyed by state+vehicle+slug — Hero/QuickFacts/PreparingSection
 * each call this hook independently on the same page, so without this a single page render would
 * fire one real network request per section instead of sharing one. Same pattern as
 * lib/phaseLadder.ts's `ladderCache`. */
const quizCache = new Map<string, Promise<Quiz | null>>();

async function loadQuiz(stateCode: string, vehicleType: string, testSlug: string): Promise<Quiz | null> {
  const res = await api.get<PaginatedResponse<Quiz>>(
    `/quizzes?state=${stateCode}&vehicle_type=${vehicleType}&slug=${testSlug}`,
  );
  return res.data[0] ?? null;
}

/**
 * Resolves the real Quiz for the current page's `/[state]/[test-slug]` route — the single source
 * of truth every section of that page (Hero, QuickFacts, PreparingSection) reads from, so they
 * all agree on the same real title/question-count/track/locked-state instead of each guessing.
 * `undefined` while loading, `null` if no matching quiz exists.
 */
export function useResolvedQuiz(testSlug: string): Quiz | null | undefined {
  const { selectedState, selectedVehicle } = useWebLayout();
  const stateCode = stateAbbreviations[selectedState] ?? "";
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";
  const key = `${stateCode}|${vehicleType}|${testSlug}`;

  // Tracks which key the resolved value belongs to, rather than eagerly resetting to `undefined`
  // inside the effect body (setState there would fire synchronously on every dependency change,
  // triggering an extra render) — a stale result for the previous key is simply never returned.
  const [resolved, setResolved] = useState<{ key: string; quiz: Quiz | null } | undefined>(undefined);

  useEffect(() => {
    if (!stateCode || !testSlug) return;
    let cancelled = false;

    let promise = quizCache.get(key);
    if (!promise) {
      promise = loadQuiz(stateCode, vehicleType, testSlug).catch(() => null);
      quizCache.set(key, promise);
    }

    promise.then((result) => {
      if (!cancelled) setResolved({ key, quiz: result });
    });

    return () => {
      cancelled = true;
    };
  }, [stateCode, vehicleType, testSlug, key]);

  return resolved?.key === key ? resolved.quiz : undefined;
}
