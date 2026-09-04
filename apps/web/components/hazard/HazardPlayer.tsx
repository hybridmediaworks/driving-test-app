"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, X } from "lucide-react";
import type {
  HazardManifest,
  HazardMarkResponse,
  HazardSimulatorAttempt,
  ManifestHazard,
} from "@driving-test-app/shared";
import { api, ApiError } from "@/lib/api";
import Button from "@/components/ui/Button";
import HazardFeedbackCard from "./HazardFeedbackCard";
import HazardHandoff from "./HazardHandoff";
import type { HazardRunOptions } from "./HazardSimulatorIntro";
import { useVimeoPlayer } from "./useVimeoPlayer";

type Phase = "countdown" | "demo" | "handoff" | "assessment" | "submitting";

type Feedback = {
  type: ManifestHazard["type"];
  typeLabel: string;
  comment: string | null;
  audioUrl: string | null;
  phase: "demo" | "assessment";
};

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function pointInBox(px: number, py: number, box: ManifestHazard["box"]): boolean {
  return px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h;
}

export default function HazardPlayer({
  slug,
  manifest,
  options,
  onComplete,
  onExit,
}: {
  slug: string;
  manifest: HazardManifest;
  options: HazardRunOptions;
  onComplete: (attempt: HazardSimulatorAttempt) => void;
  onExit: () => void;
}) {
  const demoHazards = useMemo(
    () => (options.showTutorial ? manifest.demo_hazards : []),
    [options.showTutorial, manifest.demo_hazards],
  );
  const duration = manifest.duration_seconds ?? 0;
  const totalScored = manifest.scored_hazard_count;
  const handoffAt = manifest.handoff_after_seconds ?? 0;

  const containerRef = useRef<HTMLDivElement>(null);
  const { player, error: playerError } = useVimeoPlayer(
    containerRef,
    manifest.provider_video_id,
    !options.soundOn,
  );

  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [currentTime, setCurrentTime] = useState(0);
  const [paused, setPaused] = useState(false);
  const [activeDemo, setActiveDemo] = useState<ManifestHazard | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [spottedCount, setSpottedCount] = useState(0);
  const [falseFlash, setFalseFlash] = useState<{ x: number; y: number; key: number } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Imperative run state — never mirrors of React state, safe to mutate in handlers/effects.
  const attemptIdRef = useRef<number | null>(null);
  const eventsRef = useRef<{ video_ms: number; x: number; y: number }[]>([]);
  const startedAtRef = useRef<number>(0);
  const resolvedDemoIdsRef = useRef<Set<number>>(new Set());
  const spottedIdsRef = useRef<Set<number>>(new Set());
  const finishedRef = useRef(false);

  // A fresh snapshot of the bits the long-lived `timeupdate` handler must read without going stale.
  const snapshotRef = useRef({ phase, feedback, activeDemo });
  useEffect(() => {
    snapshotRef.current = { phase, feedback, activeDemo };
  }, [phase, feedback, activeDemo]);

  const remaining = Math.max(0, totalScored - spottedCount);

  // ---- open the attempt row ----
  useEffect(() => {
    let cancelled = false;
    api
      .post<{ attempt: { id: number } }>(`/hazard-simulators/${slug}/attempts/start`, { force_new: true })
      .then((res) => {
        if (!cancelled) attemptIdRef.current = res.attempt.id;
      })
      .catch(() => {
        /* the run can still play; submit will surface any auth/gate problem */
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ---- grade + hand back ----
  const finish = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setPhase("submitting");
    setSubmitError(null);
    player?.pause().catch(() => {});

    try {
      if (!attemptIdRef.current) {
        const started = await api.post<{ attempt: { id: number } }>(
          `/hazard-simulators/${slug}/attempts/start`,
          { force_new: true },
        );
        attemptIdRef.current = started.attempt.id;
      }
      const res = await api.post<{ attempt: HazardSimulatorAttempt }>(
        `/hazard-simulators/${slug}/attempts/${attemptIdRef.current}`,
        {
          events: eventsRef.current,
          duration_seconds: Math.round((Date.now() - startedAtRef.current) / 1000),
        },
      );
      onComplete(res.attempt);
    } catch (err) {
      finishedRef.current = false;
      setSubmitError(err instanceof ApiError ? err.message : "Couldn't submit your run. Try again.");
    }
  }, [player, slug, onComplete]);

  const triggerDemoFeedback = useCallback(
    (hazard: ManifestHazard) => {
      player?.pause().catch(() => {});
      setFeedback({
        type: hazard.type,
        typeLabel: hazard.type_label,
        comment: hazard.comment,
        audioUrl: hazard.audio_url,
        phase: "demo",
      });
    },
    [player],
  );

  const continueFromDemo = useCallback(() => {
    const hazard = snapshotRef.current.activeDemo;
    if (hazard) resolvedDemoIdsRef.current.add(hazard.id);
    setActiveDemo(null);
    setFeedback(null);

    if (resolvedDemoIdsRef.current.size >= demoHazards.length) {
      setPhase("handoff");
      player?.pause().catch(() => {});
    } else {
      player?.play().catch(() => {});
    }
  }, [player, demoHazards.length]);

  const continueFromAssessment = useCallback(() => {
    setFeedback(null);
    if (currentTime >= duration - 0.5) finish();
    else player?.play().catch(() => {});
  }, [player, duration, finish, currentTime]);

  // ---- player wiring: countdown, then follow the clip ----
  useEffect(() => {
    if (!player) return;
    let disposed = false;

    const onTime = (data: { seconds: number }) => {
      if (disposed) return;
      const t = data.seconds;
      setCurrentTime(t);
      const { phase: ph, feedback: fb, activeDemo: ad } = snapshotRef.current;

      if (duration > 0 && t >= duration - 0.4 && ph !== "submitting") {
        finish();
        return;
      }
      if (fb || ph !== "demo") return;

      if (!ad) {
        const opening = demoHazards.find(
          (h) => !resolvedDemoIdsRef.current.has(h.id) && t >= h.time_start && t <= h.time_end,
        );
        if (opening) {
          setActiveDemo(opening);
          return;
        }
      } else if (t >= ad.time_end) {
        triggerDemoFeedback(ad);
        return;
      }

      if (resolvedDemoIdsRef.current.size >= demoHazards.length && t >= handoffAt) {
        setPhase("handoff");
        player.pause().catch(() => {});
      }
    };
    const onEnded = () => !disposed && finish();
    const onPlay = () => !disposed && setPaused(false);
    const onPause = () => !disposed && setPaused(true);

    player.on("timeupdate", onTime as never);
    player.on("ended", onEnded as never);
    player.on("play", onPlay as never);
    player.on("pause", onPause as never);

    player.setCurrentTime(0).catch(() => {});
    player.setMuted(!options.soundOn).catch(() => {});
    player.setVolume(options.soundOn ? 1 : 0).catch(() => {});

    let n = 3;
    const tick = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(tick);
        startedAtRef.current = Date.now();
        setPhase(demoHazards.length > 0 ? "demo" : "assessment");
        player.play().catch(() => {});
      } else {
        setCountdown(n);
      }
    }, 1000);

    return () => {
      disposed = true;
      clearInterval(tick);
      player.off("timeupdate", onTime as never);
      player.off("ended", onEnded as never);
      player.off("play", onPlay as never);
      player.off("pause", onPause as never);
    };
  }, [player, demoHazards, duration, handoffAt, options.soundOn, finish, triggerDemoFeedback]);

  // ---- Space = pause/resume during the scored round ----
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== " " || phase !== "assessment" || feedback) return;
      e.preventDefault();
      if (paused) player?.play().catch(() => {});
      else player?.pause().catch(() => {});
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [player, paused, phase, feedback]);

  // ---- false-click flash auto-clears ----
  useEffect(() => {
    if (!falseFlash) return;
    const t = setTimeout(() => setFalseFlash(null), 550);
    return () => clearTimeout(t);
  }, [falseFlash]);

  function overlayPoint(e: React.MouseEvent): { x: number; y: number } | null {
    const host = containerRef.current;
    if (!host) return null;
    const rect = host.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return null;
    return { x, y };
  }

  async function handleOverlayClick(e: React.MouseEvent) {
    const pt = overlayPoint(e);
    if (!pt) return;

    if (phase === "demo" && activeDemo && !feedback) {
      if (pointInBox(pt.x, pt.y, activeDemo.box)) triggerDemoFeedback(activeDemo);
      return;
    }
    if (phase !== "assessment" || feedback || paused) return;

    const videoMs = Math.round((player ? await player.getCurrentTime() : currentTime) * 1000);
    eventsRef.current.push({ video_ms: videoMs, x: pt.x, y: pt.y });

    const attemptId = attemptIdRef.current;
    if (!attemptId) {
      setFalseFlash({ ...pt, key: Date.now() });
      return;
    }

    try {
      const res = await api.post<HazardMarkResponse>(
        `/hazard-simulators/${slug}/attempts/${attemptId}/mark`,
        { video_ms: videoMs, x: pt.x, y: pt.y },
      );
      if (res.hit && res.hazard) {
        if (spottedIdsRef.current.has(res.hazard.id)) return;
        spottedIdsRef.current.add(res.hazard.id);
        setSpottedCount(spottedIdsRef.current.size);
        player?.pause().catch(() => {});
        setFeedback({
          type: res.hazard.type,
          typeLabel: res.hazard.type_label,
          comment: res.hazard.comment,
          audioUrl: res.hazard.audio_url,
          phase: "assessment",
        });
      } else if (!res.absorbed) {
        setFalseFlash({ ...pt, key: Date.now() });
      }
    } catch {
      setFalseFlash({ ...pt, key: Date.now() });
    }
  }

  const showDemoBox = phase === "demo" && activeDemo && !feedback;

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-1.5" aria-label={`${remaining} hazards remaining`}>
          {Array.from({ length: totalScored }).map((_, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${i < spottedCount ? "bg-green-500" : "bg-neutral-300"}`}
            />
          ))}
        </div>
        {phase === "assessment" ? (
          <p className="font-semibold tracking-wide text-neutral-900">{remaining} REMAINING</p>
        ) : (
          <p className="font-medium text-blue-600">
            {phase === "demo" ? "Walkthrough" : phase === "handoff" ? "Get ready" : ""}
          </p>
        )}
        <div className="flex items-center gap-2">
          <span className="tabular-nums text-neutral-500">
            {formatClock(currentTime)} / {formatClock(duration)}
          </span>
          {phase === "assessment" && !feedback && (
            <button
              type="button"
              onClick={() => (paused ? player?.play() : player?.pause())}
              className="rounded-full p-1.5 text-neutral-600 hover:bg-neutral-100"
              aria-label={paused ? "Resume" : "Pause"}
            >
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={onExit}
            className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100"
            aria-label="Exit simulator"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-black">
        <div ref={containerRef} className="aspect-video w-full" />

        <div
          className={`absolute inset-0 ${phase === "assessment" ? "cursor-crosshair" : ""}`}
          onClick={handleOverlayClick}
        >
          {showDemoBox && activeDemo && (
            <div
              className="absolute rounded-lg border-2 border-yellow-400 bg-yellow-300/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] motion-safe:animate-pulse motion-reduce:animate-none"
              style={{
                left: `${activeDemo.box.x * 100}%`,
                top: `${activeDemo.box.y * 100}%`,
                width: `${activeDemo.box.w * 100}%`,
                height: `${activeDemo.box.h * 100}%`,
              }}
            />
          )}

          {falseFlash && (
            <span
              key={falseFlash.key}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-red-500"
              style={{ left: `${falseFlash.x * 100}%`, top: `${falseFlash.y * 100}%` }}
            >
              <X className="h-6 w-6" strokeWidth={3} />
            </span>
          )}
        </div>

        {phase === "countdown" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
            <span className="text-7xl font-bold text-white tabular-nums">{countdown}</span>
          </div>
        )}

        {phase === "demo" && !activeDemo && !feedback && (
          <div className="absolute inset-x-0 top-0 z-10 bg-blue-600/90 px-4 py-1.5 text-center text-xs font-medium text-white">
            Walkthrough — the first {demoHazards.length} hazards are highlighted and explained
          </div>
        )}

        {phase === "handoff" && (
          <HazardHandoff
            remaining={totalScored}
            onStart={() => {
              setPhase("assessment");
              player?.play().catch(() => {});
            }}
          />
        )}

        {feedback && (
          <HazardFeedbackCard
            type={feedback.type}
            typeLabel={feedback.typeLabel}
            comment={feedback.comment}
            audioUrl={feedback.audioUrl}
            soundOn={options.soundOn}
            phase={feedback.phase}
            onContinue={feedback.phase === "demo" ? continueFromDemo : continueFromAssessment}
          />
        )}

        {phase === "submitting" && !submitError && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 text-white">
            Scoring your run…
          </div>
        )}

        {submitError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/80 p-4 text-center text-white">
            <p>{submitError}</p>
            <Button size="md" onClick={finish}>
              Retry
            </Button>
          </div>
        )}

        {playerError && phase === "countdown" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4 text-center text-sm text-white">
            {playerError}
          </div>
        )}
      </div>

      {phase === "assessment" && (
        <p className="text-center text-xs text-neutral-400">Click a hazard as it develops · Space to pause</p>
      )}
    </div>
  );
}
