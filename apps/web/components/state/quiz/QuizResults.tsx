"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Eye, RotateCcw, Zap } from "lucide-react";
import type { QuizResultsInsightResponse } from "@driving-test-app/shared";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { TFunction } from "@/lib/i18n/quiz";
import ResultCharacter from "@/components/state/quiz/ResultCharacter";

// Marketing framing for the coverage bar — the "full bank" the learner is being nudged toward.
const TOTAL_BANK = 500;

function headingLabel(percent: number, t: TFunction): string {
  if (percent === 100) return t("perfectScoreTitle");
  if (percent >= 80) return t("resultLookingGood");
  if (percent >= 50) return t("almostThereTitle");
  return t("keepPracticingTitle");
}

function SteeringWheel({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
      <line x1="12" y1="9.6" x2="12" y2="3" />
      <line x1="13.9" y1="13.2" x2="19.6" y2="16.5" />
      <line x1="10.1" y1="13.2" x2="4.4" y2="16.5" />
    </svg>
  );
}

export default function QuizResults({
  results,
  quizId,
  wrongQuestionIds,
  passingThreshold = 80,
  showUpsell = false,
  stateName = "",
  stateCode = "",
  onRetry,
  onContinue,
  onSelectQuestion,
  t,
}: {
  results: boolean[];
  quizId: number;
  wrongQuestionIds: number[];
  passingThreshold?: number;
  showUpsell?: boolean;
  stateName?: string;
  stateCode?: string;
  onRetry: () => void;
  onContinue: () => void | Promise<void>;
  onSelectQuestion: (index: number) => void;
  t: TFunction;
}) {
  const total = results.length;
  const correct = results.filter(Boolean).length;
  const incorrect = total - correct;
  const percent = total ? Math.round((correct / total) * 100) : 0;
  const isPass = percent >= passingThreshold;
  const remaining = Math.max(0, TOTAL_BANK - total);
  const estMinutes = Math.max(1, Math.ceil(total * 0.3));
  // Animated officer character for every outcome (no trophy/book). The Lottie plays when the asset
  // exists at the path below; until then the officer emoji is the fallback.
  const characterLottie: string | undefined = "/lottie/result-officer.json";
  const charEmoji = "👮";

  const [barOn, setBarOn] = useState(false);
  const [insight, setInsight] = useState<QuizResultsInsightResponse | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);

  // Animate the bars in after mount (rAF keeps the setState out of the effect body).
  useEffect(() => {
    const id = requestAnimationFrame(() => setBarOn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Fetch the LLM-backed weak areas + coach message once.
  const wrongKey = wrongQuestionIds.join(",");
  useEffect(() => {
    let cancelled = false;
    api
      .post<QuizResultsInsightResponse>(`/quizzes/${quizId}/results-insight`, {
        correct,
        total,
        wrong_question_ids: wrongQuestionIds,
      })
      .then((res) => {
        if (!cancelled) setInsight(res);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setInsightLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, wrongKey]);

  const hasWeakAreas = !!insight && insight.weak_areas.length > 0;

  return (
    <section className="relative mx-auto w-full max-w-[1080px] px-5 py-10">
      {isPass && <ConfettiBurst intensity={percent === 100 ? 170 : 90} />}

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr] lg:items-stretch">
        {/* ── Left: score + coverage + next-test (pixel-matched to reference) ── */}
        <div className="rounded-3xl border border-border bg-white p-6 shadow-[0_20px_50px_-26px_rgba(23,37,84,0.2)] sm:p-10 lg:p-14">
          <div className="relative">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm text-neutral-700">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <strong className="text-neutral-900">{correct}</strong> {t("correctAnswersLabel")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <strong className="text-neutral-900">{incorrect}</strong> {t("incorrectAnswersLabel")}
              </span>
            </div>
            <div className="absolute -top-1 right-0 flex gap-2">
              <button
                type="button"
                onClick={onRetry}
                title={t("restart")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-600"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onSelectQuestion(0)}
                title={t("all")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-600"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>

          <h1 className="mt-3 text-center font-sora text-[2.5rem] font-extrabold leading-tight text-neutral-900">
            {headingLabel(percent, t)} - {percent}%
          </h1>

          {/* Full-width score bar (header spans the whole card). */}
          <div className="mt-4 h-2.5 w-full">
            <div className="relative h-full w-full rounded-full bg-neutral-200/80">
              <div
                className="h-full rounded-full bg-[#7ed957] transition-[width] duration-1000 ease-out"
                style={{ width: `${barOn ? percent : 0}%` }}
              />
              <div
                className="absolute -top-1 h-[18px] border-l border-dashed border-neutral-400"
                style={{ left: `${passingThreshold}%` }}
              />
            </div>
          </div>

          {/* Body is inset narrower than the full-width green bar (matches the reference). */}
          <div className="px-2 sm:px-6 lg:px-12">
            <p className="mt-2 text-right text-xs text-neutral-500">
              {t("passingThresholdLabel", { percent: passingThreshold })}
            </p>

            {showUpsell && (
              <>
                <p className="mt-5 text-center text-sm leading-relaxed text-neutral-600">
                  {t("practicedCoverageA", { seen: total, total: TOTAL_BANK, state: stateName })}
                  <strong className="text-neutral-900">{t("practicedCoverageB", { remaining })}</strong>
                  {t("practicedCoverageC")}
                </p>

                <div className="mt-4">
                  <div className="text-sm">
                    <span className="font-bold text-neutral-900">{total}</span>
                    <span className="text-neutral-400">/{TOTAL_BANK}</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-[width] duration-1000 ease-out"
                      style={{ width: `${barOn ? Math.max(4, (total / TOTAL_BANK) * 100) : 0}%` }}
                    />
                  </div>
                </div>

                {/* Quick cram guide card (exact reference layout — compact so text fits one line). */}
                <div className="mt-5 rounded-2xl border border-blue-100 bg-linear-to-br from-blue-50/70 to-white p-5 shadow-[0_14px_40px_-14px_rgba(37,99,235,0.28)]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-[18px] bg-linear-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/40">
                      <span className="text-[8px] font-bold uppercase leading-none tracking-wide opacity-90">Top</span>
                      <span className="text-[22px] font-extrabold leading-none">50</span>
                      <span className="text-[8px] font-bold uppercase leading-none tracking-wide opacity-90">Missed</span>
                    </div>
                    <div className="min-w-0">
                      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-blue-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        {t("quickCramGuide")}
                      </span>
                      <p className="mt-1 text-base font-bold leading-snug text-neutral-900">
                        {t("cramGuideTitle", { state: stateName })}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-neutral-600">{t("cramGuideDesc")}</p>
                      <Button href="/cheat-sheets" size="md" className="mt-4 rounded-xl! text-sm! whitespace-nowrap">
                        {t("downloadCheatSheet", { state: stateName })} <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Button onClick={onContinue} className="mt-6 w-full rounded-2xl!">
              <SteeringWheel className="size-5" /> {t("takeNextPracticeTest")} <ChevronRight className="size-4" />
            </Button>
            <p className="mt-2.5 text-center text-xs text-neutral-500">
              {t("newQuestionsMeta", { count: total, min: estMinutes })}
            </p>

            {showUpsell && (
              <Button href="/pricing" variant="ghost" className="mt-3 w-full rounded-2xl! border border-blue-300 hover:bg-blue-50">
                {t("getAllQuestionsCta", { total: `${TOTAL_BANK}+`, state: stateCode })}
              </Button>
            )}
          </div>
        </div>

        {/* ── Right: AI weak areas + coach message + character ── */}
        <div className="relative flex flex-col overflow-hidden rounded-3xl border border-border bg-white p-6 shadow-[0_20px_50px_-26px_rgba(23,37,84,0.2)]">
          <h3 className="text-lg font-bold text-neutral-900">{t("yourWeakAreas")}</h3>

          <div className="mt-3">
            {insightLoading ? (
              <p className="text-sm text-neutral-400">{t("analyzingResults")}</p>
            ) : hasWeakAreas ? (
              <div className="flex flex-wrap gap-2">
                {insight!.weak_areas.map((area) => (
                  <span key={area} className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                    {area}
                  </span>
                ))}
              </div>
            ) : (
              <span className="inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                {t("noWeakAreas")}
              </span>
            )}
          </div>

          {hasWeakAreas && incorrect > 0 && (
            <Button
              variant="ghost"
              onClick={onRetry}
              className="mt-4 w-full rounded-2xl! border border-blue-400 hover:bg-blue-50"
            >
              <Zap className="size-4" /> {t("fixWeakAreasNow")}
            </Button>
          )}

          {/* spacer pushes the coach bubble + character to the bottom, as in the reference */}
          <div className="min-h-6 flex-1" />

          {!insightLoading && insight?.message && (
            <div className="relative rounded-2xl bg-blue-50 p-4 text-sm leading-relaxed text-neutral-700">
              {insight.message}
              {/* tail pointing down to the character */}
              <span className="absolute -bottom-2 left-10 h-4 w-4 rotate-45 bg-blue-50" />
            </div>
          )}

          <div className="-mb-6 mt-4 flex justify-center">
            <ResultCharacter emoji={charEmoji} lottieSrc={characterLottie} />
          </div>
        </div>
      </div>
    </section>
  );
}

function readThemeColor(varName: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
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

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-50" aria-hidden="true" />;
}
