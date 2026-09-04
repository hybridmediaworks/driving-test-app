"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  isMarathonStep,
  type PhaseLadderPhase,
  type PhaseLadderStep,
} from "@/lib/phaseLadder";
import {
  HANDBOOK_SECTION_ID,
  scrollToSection,
  sectionIdForPhase,
} from "@/lib/stateHubSections";

/** Quizzes of one type within a phase — "Practice Tests", "Basics Marathon", and so on. */
type Group = {
  label: string;
  steps: PhaseLadderStep[];
};

type Row = {
  label: string;
  sectionId: string;
  /** Completed out of total, in whatever unit `countLabel` describes. */
  done: number;
  total: number;
  /** Right-hand count, or null when there's nothing meaningful to show. */
  count: string | null;
  groups: Group[];
};

/** "AL Basics Marathon" -> "Basics Marathon" — the state code is already all over the page. */
function withoutStatePrefix(title: string): string {
  return title.replace(/^[A-Z]{2}\s+/, "");
}

/**
 * Groups a phase's quizzes for the checklist, preserving ladder order.
 *
 * Grouping is by real quiz type, with one exception: marathons (see isMarathonStep). Grouping a
 * 180-question marathon in with the 20-question practice tests it summarises would bury it and its
 * progress would never show, so each gets a row of its own, counted in questions rather than tests.
 */
function groupSteps(steps: PhaseLadderStep[]): Group[] {
  const groups: Group[] = [];

  for (const step of steps) {
    if (step.placeholder) continue;

    const isMarathon = isMarathonStep(step);
    // A marathon is a row of its own, named for itself; everything else pools by type.
    const label = isMarathon
      ? withoutStatePrefix(step.title ?? "Marathon")
      : pluralType(step.quizType);

    const existing = !isMarathon && groups.find((group) => group.label === label);
    if (existing) existing.steps.push(step);
    else groups.push({ label, steps: [step] });
  }

  return groups;
}

/** "Practice Test" -> "Practice Tests", for a row that stands for several of them. */
function pluralType(quizType: string | undefined): string {
  const base = quizType ?? "Tests";
  return base.endsWith("s") ? base : `${base}s`;
}

/**
 * How far through a group the learner is. A group holding several quizzes counts tests completed;
 * one holding a single quiz (a marathon, the exam simulator) counts questions seen inside it,
 * which is the only figure that moves for a test you'd take once.
 */
function groupProgress(
  group: Group,
  coveredByQuiz: Record<string, number>,
): { done: number; total: number; count: string } {
  if (group.steps.length === 1) {
    const step = group.steps[0];
    const total = Number(step.totalQuestions ?? 0);
    const done = Math.min(
      step.slug ? (coveredByQuiz[step.slug] ?? 0) : 0,
      total || Infinity,
    );
    return { done, total, count: total > 0 ? `${done}/${total}` : "" };
  }

  const done = group.steps.filter((step) => step.completed).length;
  return { done, total: group.steps.length, count: `${done}/${group.steps.length}` };
}

/** Empty / part-way / done, as a ring that fills clockwise. */
function ProgressRing({ done, total }: { done: number; total: number }) {
  const ratio = total > 0 ? Math.min(done / total, 1) : 0;

  if (ratio >= 1) {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
        <Check className="size-3" strokeWidth={3} />
      </span>
    );
  }

  const radius = 8;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden
      className="size-5 shrink-0 -rotate-90 overflow-visible"
    >
      <circle
        cx="10"
        cy="10"
        r={radius}
        fill="white"
        stroke="currentColor"
        strokeWidth="2"
        className="text-neutral-300"
      />
      {ratio > 0 && (
        <circle
          cx="10"
          cy="10"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${circumference * ratio} ${circumference}`}
          className="text-green-500"
        />
      )}
    </svg>
  );
}

function jumpTo(event: React.MouseEvent, sectionId: string) {
  if (scrollToSection(sectionId)) event.preventDefault();
}

/**
 * The paid learner's "Exam Prep" checklist: every phase of their real ladder, expandable into the
 * quiz types inside it, each with how far through it they are. Free learners get the flat list in
 * StateSidebar instead — this one only says anything extra once there's premium content to track.
 *
 * Every figure comes from the ladder (which quizzes exist, which are done) and GET /me/progress
 * (questions seen per quiz). Nothing here is estimated.
 */
export default function ExamPrepTree({
  phases,
  coveredByQuiz,
}: {
  phases: PhaseLadderPhase[];
  coveredByQuiz: Record<string, number>;
}) {
  const rows: Row[] = phases.map((phase) => {
    const groups = groupSteps(phase.steps);
    const totals = groups.map((group) => groupProgress(group, coveredByQuiz));
    const done = totals.reduce((sum, t) => sum + t.done, 0);
    const total = totals.reduce((sum, t) => sum + t.total, 0);

    return {
      label: phase.header.headerTitle,
      sectionId: sectionIdForPhase(phase.header.headerTitle, phase.phase),
      done,
      total,
      // A phase with one group shows that group's own count; with several, the chevron does the
      // talking and the numbers live on the rows underneath.
      count: groups.length === 1 ? totals[0].count : null,
      groups: groups.length > 1 ? groups : [],
    };
  });

  const [expanded, setExpanded] = useState<string[]>(() =>
    rows.find((row) => row.groups.length > 0)
      ? [rows.find((row) => row.groups.length > 0)!.sectionId]
      : [],
  );

  function toggle(sectionId: string) {
    setExpanded((current) =>
      current.includes(sectionId)
        ? current.filter((id) => id !== sectionId)
        : [...current, sectionId],
    );
  }

  return (
    <ul className="mt-3 space-y-2.5">
      {rows.map((row) => {
        const isOpen = expanded.includes(row.sectionId);

        return (
          <li key={row.sectionId}>
            <div className="flex items-center gap-2.5">
              <ProgressRing done={row.done} total={row.total} />
              <a
                href={`#${row.sectionId}`}
                onClick={(event) => jumpTo(event, row.sectionId)}
                className="min-w-0 flex-1 text-sm font-semibold text-neutral-900 hover:underline"
              >
                {row.label}
              </a>
              {row.count && (
                <span className="shrink-0 text-xs text-neutral-500">
                  {row.count}
                </span>
              )}
              {row.groups.length > 0 && (
                <button
                  type="button"
                  onClick={() => toggle(row.sectionId)}
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? "Collapse" : "Expand"} ${row.label}`}
                  className="shrink-0 rounded p-0.5 text-neutral-400 transition-colors hover:text-neutral-700"
                >
                  <ChevronDown
                    className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>

            {isOpen && row.groups.length > 0 && (
              <ul className="mt-2.5 space-y-2.5 pl-7">
                {row.groups.map((group) => {
                  const progress = groupProgress(group, coveredByQuiz);
                  return (
                    <li
                      key={group.label}
                      className="flex items-center gap-2.5"
                    >
                      <ProgressRing
                        done={progress.done}
                        total={progress.total}
                      />
                      <a
                        href={`#${row.sectionId}`}
                        onClick={(event) => jumpTo(event, row.sectionId)}
                        className="min-w-0 flex-1 text-sm font-medium text-neutral-700 hover:underline"
                      >
                        {group.label}
                      </a>
                      {progress.count && (
                        <span className="shrink-0 text-xs text-neutral-500">
                          {progress.count}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}

      <li className="flex items-center gap-2.5">
        <ProgressRing done={0} total={1} />
        <a
          href={`#${HANDBOOK_SECTION_ID}`}
          onClick={(event) => jumpTo(event, HANDBOOK_SECTION_ID)}
          className="min-w-0 flex-1 text-sm font-semibold text-neutral-900 hover:underline"
        >
          Handbook
        </a>
      </li>
    </ul>
  );
}
