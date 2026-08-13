"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Award, RotateCcw } from "lucide-react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import Button from "@/components/ui/Button";
import ReadinessUpsell from "@/components/state/quiz/ReadinessUpsell";

// 270° gauge, gap at the bottom. Angles in degrees, 0 = straight up.
const CX = 115;
const CY = 120;
const R = 88;
const A0 = -135;
const A1 = 135;

function polar(a: number): [number, number] {
  const r = (a * Math.PI) / 180;
  return [CX + R * Math.sin(r), CY - R * Math.cos(r)];
}

function arc(a: number, b: number) {
  const [x1, y1] = polar(a);
  const [x2, y2] = polar(b);
  const large = b - a > 180 ? 1 : 0;
  return `M${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2}`;
}

const val2ang = (v: number) => A0 + (A1 - A0) * v;

const TRACK = arc(A0, A1);
const ZONE_RED = arc(val2ang(0), val2ang(0.5));
const ZONE_AMBER = arc(val2ang(0.5), val2ang(0.8));
const ZONE_GREEN = arc(val2ang(0.8), val2ang(1));

const TICKS = Array.from({ length: 11 }, (_, i) => {
  const a = (val2ang(i / 10) * Math.PI) / 180;
  return {
    x1: CX + (R - 11) * Math.sin(a),
    y1: CY - (R - 11) * Math.cos(a),
    x2: CX + (R - 3) * Math.sin(a),
    y2: CY - (R - 3) * Math.cos(a),
  };
});

function zoneStrokeClass(percent: number) {
  if (percent >= 80) return "stroke-status-good";
  if (percent >= 50) return "stroke-status-warning";
  return "stroke-status-critical";
}

function zoneDotClass(percent: number) {
  if (percent >= 80) return "bg-status-good";
  if (percent >= 50) return "bg-status-warning";
  return "bg-status-critical";
}

function statusFor(percent: number) {
  if (percent === 100)
    return {
      label: "Perfect score",
      sub: "Flawless run — you nailed every question.",
    };
  if (percent >= 80)
    return {
      label: "Passed",
      sub: "Above the passing line. You're test-ready on this set.",
    };
  if (percent >= 50)
    return {
      label: "Almost there",
      sub: "Close to passing — tighten up the misses and go again.",
    };
  return {
    label: "Keep practicing",
    sub: "Review the missed rules and retry to build your streak.",
  };
}

type Badge = { name: string; note: string; progress: number };

function defaultBadges(percent: number): Badge[] {
  return [
    {
      name: "Bronze Marathoner",
      note: "nice work",
      progress: percent === 100 ? 100 : percent >= 80 ? 22 : 8,
    },
    {
      name: "Road Scholar",
      note: "keep it up",
      progress: percent === 100 ? 80 : percent >= 80 ? 60 : 20,
    },
  ];
}

type Filter = "all" | "correct" | "incorrect";

export default function QuizResults({
  quizName,
  results,
  showUpsell = false,
  stateName = "",
  stateCode = "",
  onRetry,
  onContinue,
  onSelectQuestion,
}: {
  quizName: string;
  results: boolean[];
  showUpsell?: boolean;
  stateName?: string;
  stateCode?: string;
  onRetry: () => void;
  onContinue: () => void;
  onSelectQuestion: (index: number) => void;
}) {
  const total = results.length;
  const correct = results.filter(Boolean).length;
  const incorrect = total - correct;
  const percent = total ? Math.round((correct / total) * 100) : 0;

  const { label, sub } = statusFor(percent);
  const isPerfect = percent === 100;
  const badges = useMemo(() => defaultBadges(percent), [percent]);

  const [filter, setFilter] = useState<Filter>("all");
  const [animPercent, setAnimPercent] = useState(0);
  const [barsOn, setBarsOn] = useState(false);
  const rafRef = useRef(0);

  // Count-up + bar fill run once on mount, skipped entirely under reduced motion.
  useEffect(() => {
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      setAnimPercent(percent);
      setBarsOn(true);
      return;
    }

    const start = performance.now();
    const duration = 1100;
    const step = (t: number) => {
      const e = Math.min(1, (t - start) / duration);
      const eased = 1 - (1 - e) ** 3;
      setAnimPercent(percent * eased);
      if (e < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    const barsTimer = setTimeout(() => setBarsOn(true), 60);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(barsTimer);
    };
  }, [percent]);

  const v = animPercent / 100;
  const progressArc = arc(A0, val2ang(v));
  const needleAngle = val2ang(v);

  return (
    <section className="relative grid min-h-screen items-center mx-auto w-full max-w-container px-5 py-10">
      {percent >= 80 && <ConfettiBurst intensity={isPerfect ? 170 : 90} />}

      <div className="flex justify-between gap-6 md:flex-row flex-col">
        <div
          className="bg-blue-1000 flex flex-col justify-center w-full quiz-hero rounded-3xl px-6 pt-9 pb-8 text-center text-white shadow-[0_20px_46px_-20px_rgba(13,20,44,0.55)]"
          style={{ backgroundImage: "url('/state-premium-cta.png')" }}
        >
          <Paragraph
            size="xs"
            color="white"
            className="font-semibold tracking-[0.18em] uppercase"
          >
            {quizName}
          </Paragraph>

          <div className="relative mx-auto min-h-43">
            <svg
              viewBox="0 0 230 172"
              className="block size-full overflow-visible"
            >
              <path
                d={TRACK}
                fill="none"
                className="stroke-white/10"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                d={ZONE_RED}
                fill="none"
                className="stroke-[rgba(208,59,59,0.28)]"
                strokeWidth="14"
              />
              <path
                d={ZONE_AMBER}
                fill="none"
                className="stroke-[rgba(250,178,25,0.3)]"
                strokeWidth="14"
              />
              <path
                d={ZONE_GREEN}
                fill="none"
                className="stroke-[rgba(12,163,12,0.28)]"
                strokeWidth="14"
              />
              <path
                d={progressArc}
                fill="none"
                className={`${zoneStrokeClass(percent)} transition-colors`}
                strokeWidth="14"
                strokeLinecap="round"
              />
              <g className="stroke-white/25" strokeWidth="2">
                {TICKS.map((t, i) => (
                  <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
                ))}
              </g>
              <g transform={`rotate(${needleAngle} ${CX} ${CY})`}>
                <path
                  d="M115 34 L118.5 54 L111.5 54 Z"
                  className="fill-white"
                />
              </g>
            </svg>
            <div className="absolute w-full top-28 text-center">
              <Heading as="h2" color="white">
                {Math.round(animPercent)}
                <span className="text-lg font-bold">%</span>
              </Heading>
              <Paragraph className="text-neutral-300!">
                {correct} of {total} correct
              </Paragraph>
            </div>
          </div>

          <Heading as="h1" size="2xs" color="white" className="pt-10.5">
            <span
              className={`mr-2 inline-block size-2.5 -translate-y-0.5 rounded-full align-middle ${zoneDotClass(percent)}`}
            />
            {label}
          </Heading>
          <Paragraph size="sm" className="mt-1.5 text-neutral-300!">
            {sub}
          </Paragraph>
        </div>
        <div className="w-full">
          <div className="rounded-3xl border border-border bg-white p-4.5 shadow-[0_16px_50px_-26px_rgba(23,37,84,0.20)]">
            <div className="flex flex-wrap gap-2">
              <ResultTab
                k="all"
                active={filter}
                onSelect={setFilter}
                count={total}
                label="All"
              />
              <ResultTab
                k="correct"
                active={filter}
                onSelect={setFilter}
                count={correct}
                label="Correct"
              />
              <ResultTab
                k="incorrect"
                active={filter}
                onSelect={setFilter}
                count={incorrect}
                label="Incorrect"
              />
            </div>

            <div className="mt-4 flex flex-wrap justify-start gap-1.5">
              {results.map((ok, i) => {
                if (
                  filter !== "all" &&
                  filter !== (ok ? "correct" : "incorrect")
                )
                  return null;
                return (
                  <button
                    key={i}
                    onClick={() => onSelectQuestion(i)}
                    className={`flex aspect-square w-10.5 items-center justify-center rounded-md border text-sm font-semibold ${
                      ok
                        ? "border-green-200 bg-green-50 text-green-500"
                        : "border-red-200 bg-red-50 text-red-500"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <Paragraph
            size="xs"
            color="muted"
            className="mt-6 mb-3 px-1 font-bold tracking-[0.12em] uppercase"
          >
            Progress unlocked
          </Paragraph>
          {badges.map((badge) => (
            <div
              key={badge.name}
              className="mt-3 flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <Paragraph size="sm" color="dark" className="leading-snug!">
                  Leveled up your <b>{badge.name}</b> badge — {badge.note}.
                </Paragraph>
                <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-background2">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-blue-500 to-blue-700 transition-[width] duration-900 ease-out"
                    style={{ width: `${barsOn ? badge.progress : 0}%` }}
                  />
                </div>
              </div>
              <div className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-background2 to-background3 text-neutral-400">
                <Award className="size-6.5" />
              </div>
            </div>
          ))}

          {showUpsell && (
            <ReadinessUpsell stateName={stateName} stateCode={stateCode} seenCount={total} />
          )}

          <div className="mt-6 space-y-2.5">
            {incorrect > 0 && (
              <Button
                onClick={onRetry}
                variant="outline"
                className="w-full text-red-600 border-red-600"
              >
                Retry {incorrect} missed question{incorrect > 1 ? "s" : ""}
                <RotateCcw className="size-4" />
              </Button>
            )}
            <Button onClick={onContinue} className="w-full">
              Continue
              <ArrowRight className="size-4.5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultTab({
  k,
  active,
  onSelect,
  count,
  label,
}: {
  k: Filter;
  active: Filter;
  onSelect: (k: Filter) => void;
  count: number;
  label: string;
}) {
  const isActive = active === k;

  const toneClasses =
    k === "correct"
      ? isActive
        ? "border-transparent bg-green-500 text-white"
        : "border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
      : k === "incorrect"
        ? isActive
          ? "border-transparent bg-red-500 text-white"
          : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
        : isActive
          ? "border-transparent bg-blue-1000 text-white"
          : "border-border bg-white text-neutral-900 hover:bg-background2";

  return (
    <button
      onClick={() => onSelect(k)}
      className={`rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${toneClasses}`}
    >
      {label} <span className="font-bold tabular-nums">{count}</span>
    </button>
  );
}

function readThemeColor(varName: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return value || fallback;
}

function ConfettiBurst({ intensity = 90 }: { intensity?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const palette = [
      readThemeColor("--status-good", "#0ca30c"),
      readThemeColor("--status-warning", "#fab219"),
      readThemeColor("--blue-primary", "#007aff"),
      readThemeColor("--status-critical", "#d03b3b"),
    ];

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.28;
    let parts = Array.from({ length: intensity }, (_, i) => {
      const a = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 4,
        g: 0.18 + Math.random() * 0.1,
        s: 5 + Math.random() * 7,
        c: palette[i % palette.length],
        rot: Math.random() * 6,
        vr: -0.3 + Math.random() * 0.6,
        life: 1,
      };
    });

    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      parts.forEach((p) => {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 0.006;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.5);
        ctx.restore();
      });
      parts = parts.filter((p) => p.life > 0 && p.y < canvas.height + 40);
      if (parts.length) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [intensity]);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-50"
      aria-hidden="true"
    />
  );
}
