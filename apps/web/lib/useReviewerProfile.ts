"use client";

import { useEffect, useState } from "react";
import type { ReviewerProfile } from "@driving-test-app/shared";
import { api } from "@/lib/api";

// Truly global (no state/vehicle/etc. to key by) — a single cached promise is enough, unlike
// phaseLadder.ts's per-combination Map.
let cache: Promise<ReviewerProfile | null> | null = null;

function loadReviewerProfile(): Promise<ReviewerProfile | null> {
  if (!cache) {
    cache = api.get<{ reviewer: ReviewerProfile }>("/reviewer-profile")
      .then((res) => res.reviewer)
      .catch((err) => {
        cache = null;
        throw err;
      });
  }
  return cache;
}

/**
 * The site's "accuracy verified by" reviewer profile (name, credentials, last-verified date,
 * optional photo) — admin-managed, see apps/web/app/admin/reviewer-profile. Null while loading or
 * if the fetch fails; callers should fall back to generic wording in that case rather than show
 * nothing or block rendering.
 */
export function useReviewerProfile(): ReviewerProfile | null {
  const [reviewer, setReviewer] = useState<ReviewerProfile | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadReviewerProfile()
      .then((result) => {
        if (!cancelled) setReviewer(result);
      })
      .catch(() => {
        // Fetch failed — leave `reviewer` null, callers fall back to generic wording.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return reviewer;
}

/** Formats a YYYY-MM-DD date string as "Jan 2026", matching the badge copy's existing style. */
export function formatVerifiedMonth(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
