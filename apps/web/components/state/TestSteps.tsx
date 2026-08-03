"use client";

import { useEffect, useState } from "react";
import StepCard from "@/components/state/StepCard";

type Step = {
  title?: string;
  totalQuestions?: string;
  totalTime?: string;
  type?: "free" | "premium";
  locked?: boolean;
  image?: string;
  status?: "next";
  style?: "large";
  completed?: boolean;
  justCompleted?: boolean;
};

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
}

// A row's trailing connector is really drawn by two divs (this row's
// after_row + the next row's before_row) that must always agree, since
// they're two halves of what reads as one continuous line.
function rowFillState(row: Step[]): { trigger: boolean; filled: boolean } {
  const triggerIndex = row.findIndex((s) => s.justCompleted);
  const hasTrigger = triggerIndex !== -1;
  const fullyDone = row.every((s) => s.completed && !s.justCompleted);
  return {
    trigger: hasTrigger && triggerIndex === row.length - 1,
    filled: fullyDone && !hasTrigger,
  };
}

const GAP_REM = 1.25;

function rowWidth(columns: number, count: number): string {
  return `calc((100% - ${(columns - 1) * GAP_REM}rem) / ${columns} * ${count} + ${Math.max(count - 1, 0)} * ${GAP_REM}rem)`;
}

const TABLET_COLUMNS = 3;
const MOBILE_COLUMNS = 1;
const MD_BREAKPOINT = 768;
const LG_BREAKPOINT = 1024;

type ResponsiveTier = "mobile" | "tablet" | "desktop";

function useResponsiveTier(): ResponsiveTier {
  const [tier, setTier] = useState<ResponsiveTier>("desktop");

  useEffect(() => {
    const mdQuery = window.matchMedia(`(max-width: ${MD_BREAKPOINT - 1}px)`);
    const lgQuery = window.matchMedia(`(max-width: ${LG_BREAKPOINT - 1}px)`);

    const update = () => {
      if (mdQuery.matches) setTier("mobile");
      else if (lgQuery.matches) setTier("tablet");
      else setTier("desktop");
    };

    update();
    mdQuery.addEventListener("change", update);
    lgQuery.addEventListener("change", update);
    return () => {
      mdQuery.removeEventListener("change", update);
      lgQuery.removeEventListener("change", update);
    };
  }, []);

  return tier;
}

export default function TestSteps({
  steps,
  columns = 5,
  nextConnector = false,
  phaseActive = false,
  phaseJustActivated = false,
}: {
  steps: Step[];
  columns?: number;
  nextConnector?: boolean;
  /** Phase is already active (steps in progress) — first row's entry connector renders filled, no animation. */
  phaseActive?: boolean;
  /** Phase just became active (previous phase's last step just completed) — first row's entry connector animates in. */
  phaseJustActivated?: boolean;
}) {
  const tier = useResponsiveTier();
  const isDesktop = tier === "desktop";
  const effectiveColumns =
    tier === "mobile"
      ? MOBILE_COLUMNS
      : tier === "tablet"
        ? TABLET_COLUMNS
        : columns;
  const rows = chunk(steps, effectiveColumns);
  const stepSpan = (step: Step) =>
    isDesktop && step.style === "large" ? 2 : 1;

  return (
    <div className="relative md:space-y-0 space-y-4">
      {rows.map((row, rowIndex) => {
        const rowSpan = row.reduce((total, step) => total + stepSpan(step), 0);
        const isPartialRow = rowSpan < effectiveColumns;
        const isLastRow = rowIndex === rows.length - 1;
        const showConnectorBelow = rowIndex < rows.length - 1 || nextConnector;
        const shrinkConnectorBelow =
          isPartialRow || (isLastRow && nextConnector);

        // Progress-fill: the row's trailing connector animates only when the
        // just-finished step is the last one in this row (a real row boundary);
        // it's already blue (no animation) once every step in the row is done.
        const { trigger: afterRowTriggers, filled: afterRowFilled } =
          rowFillState(row);

        // The row's LEADING connector (before_row) must mirror the state of
        // whatever feeds into it: the previous row's trailing connector, or —
        // for the first row — the phase circle itself.
        const isFirstRow = rowIndex === 0;
        const prevRowState = !isFirstRow
          ? rowFillState(rows[rowIndex - 1])
          : null;
        const beforeRowFilled = isFirstRow
          ? phaseActive && !phaseJustActivated
          : !!prevRowState?.filled;
        const beforeRowTriggers = isFirstRow
          ? phaseJustActivated
          : !!prevRowState?.trigger;

        return (
          <div
            key={rowIndex}
            className={`relative grid grid-cols-[repeat(var(--ts-cols),minmax(0,1fr))] gap-5 ${showConnectorBelow ? "md:mb-16" : ""}`}
            style={{ "--ts-cols": effectiveColumns } as React.CSSProperties}
          >
            <div
              className={`before_row pointer-events-none absolute -top-11.75 h-30.5 w-20 border-solid max-md:hidden ${
                isFirstRow
                  ? "left-0 border-b"
                  : "-left-10 rounded-l-[28px] border-14 border-r-0"
              } ${
                beforeRowFilled
                  ? "border-blue-500"
                  : beforeRowTriggers
                    ? "connector-fill border-white"
                    : "border-white"
              }`}
              style={
                beforeRowTriggers
                  ? ({
                      "--fill-index": isFirstRow ? 5 : 1,
                    } as React.CSSProperties)
                  : undefined
              }
            />
            {showConnectorBelow && (
              <div
                className={`after_row pointer-events-none absolute top-15.25 h-[calc(100%-30px)] -right-10 rounded-r-[28px] border-14 border-solid border-l-0 max-md:hidden ${
                  afterRowFilled
                    ? "border-blue-500"
                    : afterRowTriggers
                      ? "connector-fill border-white"
                      : "border-white"
                } ${shrinkConnectorBelow ? "left-15" : "w-full"}`}
                style={{
                  ...(shrinkConnectorBelow
                    ? {
                        width: `calc(${rowWidth(effectiveColumns, rowSpan)} - 20px)`,
                      }
                    : undefined),
                  ...(afterRowTriggers
                    ? ({ "--fill-index": 1 } as React.CSSProperties)
                    : undefined),
                }}
              />
            )}

            {row.map((step, index) => (
              <StepCard key={index} step={step} connector />
            ))}
          </div>
        );
      })}
    </div>
  );
}
