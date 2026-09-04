"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Flame, Pencil } from "lucide-react";
import type { UserProgress } from "@driving-test-app/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLadderPhases } from "@/lib/usePhaseCompletion";
import {
  HANDBOOK_SECTION_ID,
  scrollToSection,
  sectionIdForPhase,
} from "@/lib/stateHubSections";
import { useWebLayout } from "@/lib/web-layout-context";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatExamDate(date: string): string {
  // Parsed as parts rather than `new Date(date)` so a Y-m-d string isn't shifted a day by the
  // viewer's timezone (it's a calendar date, not an instant).
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function weekdayLetters(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day)
    .toLocaleDateString(undefined, { weekday: "short" })
    .slice(0, 2);
}

/** The learner's exam date, with inline editing behind the pencil. */
function ExamDate({ onSaved }: { onSaved: () => void }) {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(user?.exam_date ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setValue(user?.exam_date ?? "");
    setError(null);
    setEditing(true);
  }

  async function save(next: string) {
    setSaving(true);
    setError(null);
    try {
      const res = await api.put<{ exam_date: string | null }>("/me/exam-date", {
        exam_date: next || null,
      });
      if (user) setUser({ ...user, exam_date: res.exam_date });
      setEditing(false);
      onSaved();
    } catch {
      setError("Couldn't save that date. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <label
          htmlFor="exam-date"
          className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase"
        >
          Exam date
        </label>
        <div className="flex items-center gap-2">
          <input
            id="exam-date"
            type="date"
            value={value}
            disabled={saving}
            onChange={(e) => setValue(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-border bg-white px-2 py-1 text-sm text-neutral-900"
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => save(value)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
        {error && <p className="text-destructive text-xs">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
          Exam date
        </p>
        <p className="text-sm font-semibold text-blue-700">
          {user?.exam_date ? formatExamDate(user.exam_date) : "Not set yet"}
        </p>
      </div>
      <button
        type="button"
        onClick={startEditing}
        aria-label={user?.exam_date ? "Change exam date" : "Set exam date"}
        className="rounded-full border border-border bg-white p-1.5 text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <Pencil className="size-3.5" />
      </button>
    </div>
  );
}

/**
 * The signed-in learner's progress rail on the state hub — permit card with exam date and question
 * coverage, tests/questions counts, the "steps to complete" checklist driven by the real phase
 * ladder, and the daily practice streak. Modelled on driving-tests.org's own sidebar.
 *
 * Renders nothing for signed-out visitors, or while progress is still loading, so the page never
 * shows placeholder numbers. Every figure comes from GET /me/progress, which derives them from
 * recorded attempts — see ProgressController.
 */
export default function StateSidebar({
  progress,
  onReload,
}: {
  progress: UserProgress;
  onReload: () => void;
}) {
  const { user } = useAuth();
  const { selectedState } = useWebLayout();
  const phases = useLadderPhases();

  if (!user) return null;

  const { tests, questions, streak } = progress;
  const coverage =
    questions.total > 0
      ? Math.round((questions.covered / questions.total) * 100)
      : 0;

  // The checklist mirrors the real ladder for this state/vehicle/track — including the phases the
  // redesign renders as their own sections further down — then the handbook, which is the last
  // thing left before the exam. Each step knows where its section is so it can scroll to it.
  const steps = [
    ...phases.map((phase) => ({
      label: phase.header.headerTitle,
      done:
        phase.steps.length > 0 && phase.steps.every((step) => step.completed),
      sectionId: sectionIdForPhase(phase.header.headerTitle, phase.phase),
    })),
    { label: "Handbook", done: false, sectionId: HANDBOOK_SECTION_ID },
  ];

  return (
    <aside className="flex w-full flex-col gap-4" aria-label="Your progress">
      {/* Permit card */}
      <section className="rounded-2xl border border-border bg-white p-4 shadow-card">
        <p className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
          {`${selectedState} Learner's Permit`}
        </p>

        <div className="mt-3 flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
            {initialsOf(user.name)}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
              Name
            </p>
            <p className="truncate text-sm font-semibold text-neutral-900">
              {user.name}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <ExamDate onSaved={onReload} />
        </div>

        <div className="mt-4">
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-background2"
            role="progressbar"
            aria-valuenow={coverage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Questions covered"
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-green-400 to-green-600 transition-[width] duration-500"
              style={{ width: `${coverage}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="text-sm font-bold text-neutral-900">
              {coverage}%
            </span>
            <span className="text-xs text-neutral-500">of questions seen</span>
          </div>
        </div>
      </section>

      {/* Counts */}
      <section className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-card">
          <p className="text-lg font-bold text-neutral-900">
            {tests.completed}
            <span className="text-sm font-medium text-neutral-500">
              /{tests.total}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">Tests completed</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 shadow-card">
          <p className="text-lg font-bold text-neutral-900">
            {questions.covered}
            <span className="text-sm font-medium text-neutral-500">
              /{questions.total}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">Questions covered</p>
        </div>
      </section>

      {/* Steps to complete */}
      {steps.length > 1 && (
        <section className="rounded-2xl border border-border bg-white p-4 shadow-card">
          <h2 className="font-sora text-base font-semibold text-neutral-900">
            Exam Prep
          </h2>
          <p className="mt-3 text-[11px] font-semibold tracking-wide text-blue-600 uppercase">
            Steps to complete
          </p>
          <ol className="mt-3">
            {steps.map((step, index) => (
              <li key={step.sectionId} className="relative">
                {/* Dashed rail joining this step's circle to the next one's. Sits behind the row
                    and runs past the list item's own box into the gap below it. */}
                {index < steps.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute top-1/2 -bottom-2 left-[13px] border-l-2 border-dashed border-blue-300"
                  />
                )}
                <a
                  href={`#${step.sectionId}`}
                  onClick={(event) => {
                    // Let the browser handle it if that section isn't on the page (no handbook for
                    // this state, say) rather than swallowing the click.
                    if (scrollToSection(step.sectionId)) event.preventDefault();
                  }}
                  className="relative flex items-center gap-3 rounded-lg py-1 pr-1.5 transition-colors hover:bg-background2"
                >
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold ${
                      step.done
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-blue-300 bg-white text-blue-600"
                    }`}
                  >
                    {step.done ? <Check className="size-3.5" /> : index + 1}
                  </span>
                  <span
                    className={`text-sm font-semibold ${step.done ? "text-neutral-400 line-through" : "text-neutral-900"}`}
                  >
                    {step.label}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Streak */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-card">
        <h2 className="font-sora text-base font-semibold text-neutral-900">
          {streak.current} Day Streak
        </h2>
        <p className="mt-1 max-w-[70%] text-xs text-neutral-500">
          Your streak continues when you answer {streak.daily_target} questions
          each day.
        </p>
        <ul className="mt-3 flex gap-2">
          {streak.days.map((day) => (
            <li key={day.date} className="flex flex-col items-center gap-1">
              <span className="text-[11px] text-neutral-500">
                {weekdayLetters(day.date)}
              </span>
              <span
                title={`${day.answered} answered`}
                className={`flex size-5 items-center justify-center rounded-full ${
                  day.met
                    ? "bg-blue-600 text-white"
                    : "border border-border bg-white"
                }`}
              >
                {day.met && <Check className="size-3" />}
              </span>
            </li>
          ))}
        </ul>
        <Flame
          aria-hidden
          className="absolute right-3 bottom-3 size-10 text-orange-400/70"
        />
      </section>

      <Link
        href="/dashboard"
        className="rounded-2xl border border-border bg-white px-4 py-3 text-center text-sm font-semibold text-blue-700 shadow-card hover:underline"
      >
        See full progress &rarr;
      </Link>
    </aside>
  );
}
