"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUp, CornerUpRight, Flag, Lock } from "lucide-react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import StudyRouteStepRow, { stepHref, stepMeta } from "@/components/state/permit-test/StudyRouteStepRow";
import { useHasProgressSidebar } from "@/components/state/StateHubLayout";
import { useEntitlement } from "@/lib/auth-context";
import { isMarathonStep, phaseSummary, type PhaseLadderPhase, type PhaseLadderStep } from "@/lib/phaseLadder";
import { DEFAULT_PASSING_SCORE_PERCENT } from "@/lib/quizPassMark";
import {
  PROMOTED_TO_OWN_SECTION,
  phaseAnchorId,
  scrollToSection,
  splitLadderPhases,
} from "@/lib/stateHubSections";
import { useLadderPhases } from "@/lib/usePhaseCompletion";
import { stateToSlug } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

export type StageTone = { bg: string; fg: string; text: string; ring: string };

const STAGE_TONES: StageTone[] = [
  { bg: "bg-blue-600", fg: "text-white", text: "text-blue-600 dark:text-blue-400", ring: "border-blue-200 text-blue-600" },
  { bg: "bg-violet-600", fg: "text-white", text: "text-violet-600 dark:text-violet-400", ring: "border-violet-200 text-violet-600" },
  { bg: "bg-amber-400", fg: "text-neutral-900", text: "text-amber-700 dark:text-amber-400", ring: "border-amber-200 text-amber-700" },
  { bg: "bg-red-500", fg: "text-white", text: "text-red-600 dark:text-red-400", ring: "border-red-200 text-red-600" },
  { bg: "bg-slate-600", fg: "text-white", text: "text-slate-600 dark:text-slate-400", ring: "border-slate-300 text-slate-600" },
  { bg: "bg-teal-600", fg: "text-white", text: "text-teal-600 dark:text-teal-400", ring: "border-teal-200 text-teal-600" },
  { bg: "bg-pink-600", fg: "text-white", text: "text-pink-600 dark:text-pink-400", ring: "border-pink-200 text-pink-600" },
];

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

function toneFor(index: number): StageTone {
  return STAGE_TONES[index % STAGE_TONES.length];
}

function realSteps(phase: PhaseLadderPhase): PhaseLadderStep[] {
  return phase.steps.filter((s) => !s.placeholder);
}

function formatStudyTime(minutes: number): string {
  if (minutes <= 0) return "—";
  return minutes >= 60 ? `~${Math.round(minutes / 60)} h` : `~${minutes} min`;
}

type Filter = "all" | "free";

export default function StudyRouteSection() {
  const phases = useLadderPhases();
  const { selectedState, selectedVehicle } = useWebLayout();
  const isPremium = useEntitlement().isPremiumFor(selectedVehicle);
  const hasSidebar = useHasProgressSidebar();
  const [filter, setFilter] = useState<Filter>("all");

  const stateSlug = selectedState ? stateToSlug(selectedState) : undefined;
  const showAccessTag = !isPremium;

  const stages = splitLadderPhases(phases, selectedVehicle)
    .ladder.filter((p) => !PROMOTED_TO_OWN_SECTION.includes(p.header.headerTitle))
    .filter((p) => realSteps(p).length > 0);

  if (stages.length === 0) return null;

  const allSteps = stages.flatMap(realSteps);
  const freeCount = allSteps.filter((s) => s.type === "free").length;
  const current =
    allSteps.find((s) => s.status === "next") ?? allSteps.find((s) => !s.completed && !s.locked) ?? null;
  const currentIndex = current ? allSteps.indexOf(current) : -1;
  const following = currentIndex >= 0 ? allSteps[currentIndex + 1] : undefined;
  const currentStageNumber = current ? stages.findIndex((p) => p.steps.includes(current)) + 1 : 0;
  const currentHref = current ? stepHref(current, stateSlug) : null;

  const remaining = allSteps.filter((s) => !s.completed);
  const studyMinutes = remaining.reduce((sum, s) => sum + Number(s.totalTime ?? 0), 0);

  const premiumLocked = allSteps.filter((s) => s.locked && s.lockMode === "premium");
  const premiumMarathons = premiumLocked.filter(isMarathonStep).length;
  const premiumTests = premiumLocked.length - premiumMarathons;
  const firstPremiumLocked = filter === "all" && showAccessTag ? premiumLocked[0] : undefined;

  const simulatorQuestions = phases
    .find((p) => p.header.headerTitle === "The exam simulator")
    ?.steps.find((s) => !s.placeholder)?.totalQuestions;
  const examLabel =
    selectedVehicle === "CDL"
      ? "CDL knowledge test"
      : selectedVehicle === "Motorcycle"
        ? "motorcycle knowledge test"
        : "knowledge test";

  const showFilter = showAccessTag && freeCount > 0 && freeCount < allSteps.length;
  const showRail = !hasSidebar;

  const stageWord = numberWord(stages.length);
  const title = `${stageWord.charAt(0).toUpperCase()}${stageWord.slice(1)} ${stages.length === 1 ? "stage" : "stages"}, one pass`;

  const upsellLine = [
    premiumTests > 0 ? `${premiumTests} more ${premiumTests === 1 ? "test" : "tests"}` : null,
    premiumMarathons > 0 ? `${premiumMarathons} ${premiumMarathons === 1 ? "marathon" : "marathons"}` : null,
  ]
    .filter(Boolean)
    .join(" and ");

  return (
    <section id="study-route" className="bg-background2 px-5 pt-15 pb-15 lg:pt-28 lg:pb-24">
      <div className="mx-auto max-w-container">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">
              Your study route
            </p>
            <Heading size="md" weight="bold" className="mt-3">
              {title}
            </Heading>
            <Paragraph size="lg" color="muted" className="mt-3 max-w-150">
              Start with the essentials and work up to the rules that cost people points. Your next test is always one
              tap away.
            </Paragraph>
          </div>
          {showFilter && (
            <div className="inline-flex shrink-0 self-start rounded-full border border-border bg-white p-1 shadow-xs md:self-auto dark:bg-neutral-800">
              {(
                [
                  ["all", `All tests · ${allSteps.length}`],
                  ["free", `Free · ${freeCount}`],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${
                    filter === value
                      ? "bg-blue-950 font-bold text-white dark:bg-blue-600"
                      : "font-semibold text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`mt-10 grid grid-cols-1 gap-8 ${showRail ? "lg:grid-cols-[320px_minmax(0,1fr)]" : ""}`}>
          {showRail && (
            <aside className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
              {current && (
                <div className="rounded-3xl bg-blue-950 p-3 text-white shadow-hover">
                  <div className="relative h-32 overflow-hidden rounded-2xl bg-blue-900">
                    {current.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={current.image} alt="" className="h-full w-full object-cover" />
                    )}
                    {showAccessTag && current.type === "free" && (
                      <span className="absolute left-2 top-2 rounded-lg bg-green-500 px-2 py-1 text-[11px] font-bold uppercase leading-none text-white">
                        Free
                      </span>
                    )}
                  </div>
                  <div className="px-2 pb-1 pt-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600">
                        <CornerUpRight className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-300">
                          Next stop · Stage {currentStageNumber}
                        </p>
                        <p className="mt-0.5 font-sora text-lg font-bold leading-snug">{current.title}</p>
                        <p className="mt-0.5 text-sm text-blue-100/70">{stepMeta(current, "about ")}</p>
                      </div>
                    </div>
                    {currentHref && (
                      <Link
                        href={currentHref}
                        className="mt-4 flex h-11 items-center justify-center gap-1.5 rounded-xl bg-white text-sm font-bold text-blue-950 transition-colors hover:bg-blue-50"
                      >
                        {current.inProgress ? "Continue test" : "Start test"} <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                    {following && (
                      <p className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3 text-sm">
                        <span className="text-blue-100/60">Then</span>
                        <ArrowUp className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate font-semibold">{following.title}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-xs dark:bg-neutral-800">
                <div className="grid grid-cols-3 divide-x divide-border">
                  {[
                    { value: formatStudyTime(studyMinutes), label: "study time", tone: "text-green-700 dark:text-green-400" },
                    { value: String(remaining.length), label: "tests to go", tone: "text-neutral-900 dark:text-neutral-100" },
                    { value: `${DEFAULT_PASSING_SCORE_PERCENT}%`, label: "to pass", tone: "text-neutral-900 dark:text-neutral-100" },
                  ].map(({ value, label, tone }) => (
                    <div key={label} className="px-4 py-4">
                      <p className={`font-sora text-2xl font-bold leading-none ${tone}`}>{value}</p>
                      <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
                    </div>
                  ))}
                </div>
                <ul className="space-y-0.5 border-t border-border p-3 max-lg:hidden">
                  {stages.map((phase, index) => {
                    const steps = realSteps(phase);
                    const done = steps.filter((s) => s.completed).length;
                    return (
                      <li key={phase.phase}>
                        <button
                          type="button"
                          onClick={() => scrollToSection(phaseAnchorId(phase.phase))}
                          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700"
                        >
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${toneFor(index).bg}`}
                          >
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-bold text-neutral-900 dark:text-neutral-100">
                            {phase.header.headerTitle}
                          </span>
                          <span className="text-sm text-neutral-500 dark:text-neutral-400">
                            {done}/{steps.length}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>
          )}

          <div className="rounded-3xl border border-border bg-white p-5 shadow-xs md:p-8 dark:bg-neutral-800">
            {stages.map((phase, stageIndex) => {
              const tone = toneFor(stageIndex);
              const steps = realSteps(phase);
              const visible = filter === "free" ? steps.filter((s) => s.type === "free") : steps;
              if (visible.length === 0) return null;

              const stageLocked = steps.every((s) => s.locked && s.lockMode === "premium");
              const done = steps.filter((s) => s.completed).length;
              const summary = phaseSummary(phase);
              const lockedHere = steps.filter((s) => s.locked && s.lockMode === "premium").length;

              return (
                <div
                  key={phase.phase}
                  id={phaseAnchorId(phase.phase)}
                  className="scroll-mt-6 border-border not-first:mt-8 not-first:border-t not-first:pt-8"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-sora text-lg font-bold ${tone.bg} ${tone.fg}`}
                    >
                      {stageIndex + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${tone.text}`}>
                        {summary}
                        {stageIndex === 0 && " · Your journey begins here"}
                      </p>
                      <h3 className="font-sora text-2xl font-bold leading-tight text-neutral-900 md:text-[26px] dark:text-neutral-100">
                        {phase.header.headerTitle}
                      </h3>
                      {phase.header.headerDesc && (
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{phase.header.headerDesc}</p>
                      )}
                    </div>
                    {stageLocked && showAccessTag ? (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                        <Lock className="h-3.5 w-3.5" /> Premium
                      </span>
                    ) : (
                      <span className="shrink-0 pt-6 text-sm font-semibold tracking-wider text-neutral-600 dark:text-neutral-300">
                        {done} / {steps.length}
                      </span>
                    )}
                  </div>

                  <ul className="relative mt-6 space-y-3">
                    <span
                      aria-hidden
                      className="absolute top-6 bottom-6 left-5.25 border-l-2 border-dotted border-neutral-300 dark:border-neutral-600"
                    />
                    {visible.map((step) => (
                      <Fragment key={step.slug ?? step.step}>
                        {step === firstPremiumLocked && (
                          <li className="relative flex items-center gap-3 sm:gap-4">
                            <span className="w-11 shrink-0" />
                            <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center dark:border-amber-500/30 dark:bg-amber-500/10">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-neutral-900 md:text-base dark:text-neutral-100">
                                  {upsellLine} with Premium
                                </p>
                                <p className="mt-0.5 text-sm text-amber-900/70 dark:text-amber-200/70">
                                  Unlock the rest of the route, starting with{" "}
                                  {lockedHere === 1 ? "this one" : `these ${numberWord(lockedHere)}`}.
                                </p>
                              </div>
                              <Link
                                href="/pricing"
                                className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-yellow-400 px-5 text-sm font-bold text-neutral-900 transition-colors hover:bg-yellow-500"
                              >
                                See Premium
                              </Link>
                            </div>
                          </li>
                        )}
                        <StudyRouteStepRow
                          step={step}
                          index={steps.indexOf(step)}
                          tone={tone}
                          isCurrent={step === current}
                          stageLocked={stageLocked}
                          showAccessTag={showAccessTag}
                          stateSlug={stateSlug}
                        />
                      </Fragment>
                    ))}
                  </ul>
                </div>
              );
            })}

            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-8">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-700 text-white">
                <Flag className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Destination</p>
                <p className="font-sora text-2xl font-bold leading-tight text-neutral-900 md:text-[26px] dark:text-neutral-100">
                  {selectedState} {examLabel}
                </p>
              </div>
              <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                {simulatorQuestions ? `${simulatorQuestions} questions · ` : ""}
                {DEFAULT_PASSING_SCORE_PERCENT}% to pass
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
