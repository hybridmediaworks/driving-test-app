"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Gauge, MousePointerClick, RotateCcw, Target, X } from "lucide-react";
import type { HazardManifest, HazardSimulatorAttempt } from "@driving-test-app/shared";
import Button from "@/components/ui/Button";
import PassFailBadge from "@/components/ui/PassFailBadge";
import { useVimeoPlayer } from "./useVimeoPlayer";

const BAND_LABEL: Record<string, string> = { fast: "Fast", average: "Average", slow: "Slow" };

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex-1 rounded-xl border border-border bg-white p-4 text-center">
      <Icon className="mx-auto h-5 w-5 text-blue-600" />
      <p className="mt-2 text-xl font-semibold text-neutral-900">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

/**
 * Results screen — the single Hazard Score, three stat tiles, a step-through review of every
 * missed hazard (replays its moment in the clip with the explanation), and Try Again. Mirrors the
 * reference results screen.
 */
export default function HazardResults({
  attempt,
  manifest,
  onRetry,
  onExit,
}: {
  attempt: HazardSimulatorAttempt;
  manifest: HazardManifest;
  onRetry: () => void;
  onExit: () => void;
}) {
  const missed = useMemo(
    () => (attempt.breakdown ?? []).filter((h) => !h.spotted && !h.auto_credited),
    [attempt.breakdown],
  );

  const [reviewing, setReviewing] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { player } = useVimeoPlayer(containerRef, reviewing ? manifest.provider_video_id : null, true);

  const current = missed[reviewIndex];

  // Seek to the current missed hazard's moment and play a short window of it.
  useEffect(() => {
    if (!player || !current) return;
    let stopTimer: ReturnType<typeof setTimeout>;
    player.setCurrentTime(current.seek_to).then(() => {
      player.play().catch(() => {});
      const windowMs = Math.max(3000, (current.time_end - current.seek_to + 1.5) * 1000);
      stopTimer = setTimeout(() => player.pause().catch(() => {}), windowMs);
    });
    return () => clearTimeout(stopTimer);
  }, [player, current]);

  const score = attempt.score ?? 0;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="rounded-2xl border border-border bg-white p-6 text-center sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Hazard Score</p>
        <p className="my-2 text-5xl font-bold text-blue-600">{score}%</p>
        <PassFailBadge passed={attempt.passed} failedLabel="Below the pass mark" size="sm" />

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <StatTile
            icon={Target}
            label="Hazards spotted"
            value={`${attempt.hazards_spotted}/${attempt.hazards_total}`}
          />
          <StatTile
            icon={Gauge}
            label="Reaction speed"
            value={attempt.avg_reaction_ms != null ? `${attempt.avg_reaction_ms} ms` : "—"}
            sub={attempt.reaction_band ? BAND_LABEL[attempt.reaction_band] : undefined}
          />
          <StatTile icon={MousePointerClick} label="False clicks" value={String(attempt.false_clicks)} />
        </div>
      </div>

      {missed.length > 0 && !reviewing && (
        <Button
          variant="outline"
          onClick={() => {
            setReviewIndex(0);
            setReviewing(true);
          }}
          className="w-full"
          size="md"
        >
          Review {missed.length} missed {missed.length === 1 ? "hazard" : "hazards"}
        </Button>
      )}

      {reviewing && current && (
        <div className="space-y-3 rounded-2xl border border-border bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-700">
              Missed hazard {reviewIndex + 1} of {missed.length}
            </p>
            <button
              type="button"
              onClick={() => setReviewing(false)}
              className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100"
              aria-label="Close review"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-hidden rounded-xl bg-black">
            <div ref={containerRef} className="aspect-video w-full" />
          </div>

          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{current.type_label}</p>
            <p className="text-sm text-neutral-700">{current.comment}</p>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              icon={ChevronLeft}
              onClick={() => setReviewIndex((i) => Math.max(0, i - 1))}
              disabled={reviewIndex === 0}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={ChevronRight}
              iconPosition="right"
              onClick={() => setReviewIndex((i) => Math.min(missed.length - 1, i + 1))}
              disabled={reviewIndex === missed.length - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button icon={RotateCcw} onClick={onRetry} className="flex-1" size="md">
          Try Again
        </Button>
        <Button variant="outline" onClick={onExit} className="flex-1" size="md">
          Done
        </Button>
      </div>
    </div>
  );
}
