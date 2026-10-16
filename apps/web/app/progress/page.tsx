"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Flame, Gem, Lock, Pencil } from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ExamDateDialog from "@/components/state/permit-test/ExamDateDialog";
import { useAuth, useEntitlement } from "@/lib/auth-context";
import type { PhaseLadderStep } from "@/lib/phaseLadder";
import { currentPath, loginHref } from "@/lib/redirect";
import { splitLadderPhases } from "@/lib/stateHubSections";
import { stateToSlug } from "@/lib/usStates";
import { useExamDate } from "@/lib/useExamDate";
import { useLearnerProgress } from "@/lib/useLearnerProgress";
import { useLadderPhases } from "@/lib/usePhaseCompletion";
import { useWebLayout, WebLayoutProvider } from "@/lib/web-layout-context";

const CARD = "rounded-2xl border border-border bg-white dark:bg-neutral-800 shadow-card";

function formatDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function weekday(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2);
}

function stepStatus(step: PhaseLadderStep): { label: string; tone: string } {
  if (step.attempted && step.outcome === "passed") return { label: "Passed", tone: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300" };
  if (step.attempted && step.outcome === "failed") return { label: "Not passed yet", tone: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300" };
  if (step.attempted) return { label: "Completed", tone: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300" };
  if (step.inProgress) {
    return { label: `In progress ${step.inProgress.answered}/${step.inProgress.total}`, tone: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300" };
  }
  if (step.locked) return { label: "Locked", tone: "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300" };
  return { label: "Not started", tone: "bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300" };
}

function Tile({ value, total, label }: { value: string | number; total?: number; label: string }) {
  return (
    <div className={`${CARD} p-5`}>
      <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        {value}
        {total !== undefined && (
          <span className="text-base font-medium text-neutral-500 dark:text-neutral-400">/{total}</span>
        )}
      </p>
      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="states" />
        <main className="flex-1">
          <ProgressContent />
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}

function ProgressContent() {
  const { user, loading: authLoading } = useAuth();
  const { isPremium, loading: entitlementLoading } = useEntitlement();
  const { selectedState, selectedVehicle } = useWebLayout();
  const { progress, loading: progressLoading } = useLearnerProgress();
  const { examDate } = useExamDate();
  const phases = useLadderPhases();
  const [examDateOpen, setExamDateOpen] = useState(false);

  const stateSlug = stateToSlug(selectedState);
  const { ladder, endorsements } = splitLadderPhases(phases, selectedVehicle);
  const allPhases = [...ladder, ...endorsements];
  const byQuiz = progress?.questions.by_quiz ?? {};

  let body;
  if (authLoading || (user && (entitlementLoading || progressLoading))) {
    body = <p className="text-sm text-muted-foreground">Loading your progress…</p>;
  } else if (!user) {
    body = (
      <div className={`${CARD} flex flex-col items-start gap-3 p-6`}>
        <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Log in to see your progress</p>
        <Link
          href={loginHref(currentPath())}
          className="inline-flex rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Log in
        </Link>
      </div>
    );
  } else if (!isPremium) {
    body = (
      <div className={`${CARD} flex flex-col items-start gap-3 p-6`}>
        <Gem aria-hidden className="size-8 text-yellow-500" />
        <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">This page is for Premium learners</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Upgrade to see every test, your question coverage and your daily streak in one place.
        </p>
        <Link
          href="/pricing"
          className="inline-flex rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Upgrade to Premium
        </Link>
      </div>
    );
  } else if (!progress) {
    body = (
      <p className="text-sm text-muted-foreground">
        No progress yet for {selectedState}. Take a practice test to get started.
      </p>
    );
  } else {
    const percent =
      progress.questions.total > 0 ? Math.round((progress.questions.covered / progress.questions.total) * 100) : 0;

    body = (
      <div className="space-y-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <section className={`${CARD} p-5 lg:col-span-2`}>
            <p className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
              {`${selectedState} learner’s permit`}
            </p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Name</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{user.name}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Exam date</p>
                <button
                  type="button"
                  onClick={() => setExamDateOpen(true)}
                  className="inline-flex cursor-pointer items-center gap-1.5 font-semibold text-blue-700 hover:underline dark:text-blue-300"
                >
                  {examDate ? formatDate(examDate) : "Set your exam date"}
                  <Pencil className="size-3.5" aria-hidden />
                </button>
              </div>
            </div>
            <div className="mt-5">
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-background2"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Questions seen"
              >
                <div
                  className="h-full rounded-full bg-linear-to-r from-green-400 to-green-600 transition-[width] duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{percent}%</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">of questions seen</span>
              </div>
            </div>
          </section>

          <section className={`${CARD} relative overflow-hidden p-5`}>
            <h2 className="font-sora text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {progress.streak.current} Day Streak
            </h2>
            <p className="mt-1 max-w-[75%] text-xs text-neutral-500 dark:text-neutral-400">
              Answer {progress.streak.daily_target} questions a day to keep it going. Today: {progress.streak.answered_today}.
            </p>
            <ul className="mt-3 flex gap-2">
              {progress.streak.days.map((day) => (
                <li key={day.date} className="flex flex-col items-center gap-1">
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{weekday(day.date)}</span>
                  <span
                    title={`${day.answered} answered`}
                    className={`flex size-6 items-center justify-center rounded-full ${
                      day.met ? "bg-blue-600 text-white" : "border border-border"
                    }`}
                  >
                    {day.met && <Check className="size-3.5" />}
                  </span>
                </li>
              ))}
            </ul>
            <Flame aria-hidden className="absolute top-4 right-4 size-8 text-orange-400/70" />
          </section>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Tile value={progress.tests.completed} total={progress.tests.total} label="Tests completed" />
          <Tile value={progress.questions.covered} total={progress.questions.total} label="Questions covered" />
        </div>

        <div className="space-y-4">
          <h2 className="font-sora text-lg font-semibold text-neutral-900 dark:text-neutral-100">Every test, step by step</h2>
          {allPhases.map((phase) => {
            const steps = phase.steps.filter((s) => s.slug && !s.placeholder);
            if (steps.length === 0) return null;
            const done = steps.filter((s) => s.attempted).length;
            return (
              <section key={phase.phase} className={`${CARD} overflow-hidden`}>
                <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{phase.header.headerTitle}</h3>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {done}/{steps.length} completed
                  </span>
                </div>
                <ul className="divide-y divide-border">
                  {steps.map((step) => {
                    const status = stepStatus(step);
                    const total = Number(step.totalQuestions ?? 0);
                    const covered = step.slug ? (byQuiz[step.slug] ?? 0) : 0;
                    const row = (
                      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{step.title}</p>
                          {total > 0 && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {covered}/{total} questions seen
                            </p>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.tone}`}>
                          {step.locked && <Lock className="size-3" aria-hidden />}
                          {status.label}
                        </span>
                      </div>
                    );
                    return (
                      <li key={step.slug}>
                        {step.locked ? row : (
                          <Link href={`/${stateSlug}/${step.slug}`} className="block hover:bg-neutral-50 dark:hover:bg-neutral-700/40">
                            {row}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        <ExamDateDialog open={examDateOpen} onOpenChange={setExamDateOpen} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-5 py-10 lg:py-14">
      <div className="space-y-1">
        <h1 className="font-overpass text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Your progress</h1>
        <p className="text-muted-foreground">How you&rsquo;re tracking towards passing your {selectedState} exam</p>
      </div>
      {body}
    </div>
  );
}
