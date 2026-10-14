"use client";

import Link from "next/link";
import { Check, Flame, Gem } from "lucide-react";
import AppLayout from "@/components/app/AppLayout";
import ExamPrepTree from "@/components/state/ExamPrepTree";
import { useEntitlement } from "@/lib/auth-context";
import { useLearnerProgress } from "@/lib/useLearnerProgress";
import { useLadderPhases } from "@/lib/usePhaseCompletion";
import { splitLadderPhases } from "@/lib/stateHubSections";
import { useWebLayout } from "@/lib/web-layout-context";

function weekdayLetters(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day)
    .toLocaleDateString(undefined, { weekday: "short" })
    .slice(0, 2);
}

/**
 * The dedicated progress page premium learners get instead of being sent to the generic
 * dashboard. Reuses the same GET /me/progress data and phase ladder the state hub's sidebar
 * already renders (StateSidebar.tsx), laid out full-page instead of in a narrow rail — first
 * version built from the team's own reference screenshot rather than driving-tests.org's actual
 * page, which is itself locked behind a premium login we don't have access to. Expect this to be
 * refined once there's something concrete to compare it against.
 */
export default function ProgressPage() {
  const { isPremium, loading: entitlementLoading } = useEntitlement();
  const { selectedState, selectedVehicle } = useWebLayout();
  const { progress, loading: progressLoading } = useLearnerProgress();
  const phases = useLadderPhases();

  const loading = entitlementLoading || progressLoading;
  const { ladder, endorsements } = splitLadderPhases(phases, selectedVehicle);

  return (
    <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Progress", href: "/progress" }]}>
      <div className="app-page space-y-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="space-y-0.5">
          <h1 className="text-lg font-semibold">Your progress</h1>
          <p className="text-sm text-muted-foreground">
            How you&rsquo;re tracking towards passing your {selectedState} exam
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading your progress…</p>
        ) : !isPremium ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-white dark:bg-neutral-800 p-6 shadow-card">
            <Gem aria-hidden className="size-8 text-yellow-500" />
            <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              This page is for Premium learners
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Upgrade to track full coverage, your exam-prep checklist, and your daily streak in
              one place.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Upgrade to Premium
            </Link>
          </div>
        ) : !progress ? (
          <p className="text-sm text-muted-foreground">
            No progress yet for {selectedState} — take a practice test to get started.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Coverage */}
            <section className="rounded-2xl border border-border bg-white dark:bg-neutral-800 p-5 shadow-card lg:col-span-2">
              <p className="text-[11px] font-semibold tracking-wide text-neutral-500 dark:text-neutral-400 uppercase">
                {selectedState} question coverage
              </p>
              <div className="mt-3">
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-background2"
                  role="progressbar"
                  aria-valuenow={
                    progress.questions.total > 0
                      ? Math.round((progress.questions.covered / progress.questions.total) * 100)
                      : 0
                  }
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Questions covered"
                >
                  <div
                    className="h-full rounded-full bg-linear-to-r from-green-400 to-green-600 transition-[width] duration-500"
                    style={{
                      width: `${
                        progress.questions.total > 0
                          ? Math.round((progress.questions.covered / progress.questions.total) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="mt-1.5 flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {progress.questions.total > 0
                      ? Math.round((progress.questions.covered / progress.questions.total) * 100)
                      : 0}
                    %
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">of questions seen</span>
                </div>
              </div>
            </section>

            {/* Counts */}
            <section className="rounded-2xl border border-border bg-white dark:bg-neutral-800 p-5 shadow-card">
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {progress.tests.completed}
                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  /{progress.tests.total}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">Tests completed</p>
            </section>
            <section className="rounded-2xl border border-border bg-white dark:bg-neutral-800 p-5 shadow-card">
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {progress.questions.covered}
                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  /{progress.questions.total}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">Questions covered</p>
            </section>

            {/* Exam prep checklist */}
            {(ladder.length > 0 || endorsements.length > 0) && (
              <section className="rounded-2xl border border-border bg-white dark:bg-neutral-800 p-5 shadow-card lg:col-span-2">
                <h2 className="font-sora text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  Exam Prep
                </h2>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Steps open on the {selectedState} hub page — this list mirrors the sidebar there.
                </p>
                <div className="mt-4">
                  <ExamPrepTree phases={ladder} coveredByQuiz={progress.questions.by_quiz ?? {}} />
                </div>
                {endorsements.length > 0 && (
                  <>
                    <p className="mt-5 text-[11px] font-semibold tracking-wide text-neutral-500 dark:text-neutral-400 uppercase">
                      Additional endorsements
                    </p>
                    <ExamPrepTree
                      phases={endorsements}
                      coveredByQuiz={progress.questions.by_quiz ?? {}}
                      includeHandbook={false}
                      collapsible={false}
                    />
                  </>
                )}
              </section>
            )}

            {/* Streak */}
            <section className="relative overflow-hidden rounded-2xl border border-border bg-white dark:bg-neutral-800 p-5 shadow-card lg:col-span-2">
              <h2 className="font-sora text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {progress.streak.current} Day Streak
              </h2>
              <p className="mt-1 max-w-[70%] text-xs text-neutral-500 dark:text-neutral-400">
                Your streak continues when you answer {progress.streak.daily_target} questions each
                day.
              </p>
              <ul className="mt-3 flex gap-3">
                {progress.streak.days.map((day) => (
                  <li key={day.date} className="flex flex-col items-center gap-1">
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {weekdayLetters(day.date)}
                    </span>
                    <span
                      title={`${day.answered} answered`}
                      className={`flex size-6 items-center justify-center rounded-full ${
                        day.met
                          ? "bg-blue-600 text-white"
                          : "border border-border bg-white dark:bg-neutral-800"
                      }`}
                    >
                      {day.met && <Check className="size-3.5" />}
                    </span>
                  </li>
                ))}
              </ul>
              <Flame aria-hidden className="absolute right-4 bottom-4 size-12 text-orange-400/70" />
            </section>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
