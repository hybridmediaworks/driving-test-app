"use client";

import { useEffect, useState } from "react";
import { Diamond, Gem, LockKeyhole } from "lucide-react";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";

type Step = {
  title?: string;
  totalQuestions?: string;
  totalTime?: string;
  type?: "free" | "premium";
  locked?: boolean;
  image?: string;
  status?: "next";
  style?: "large";
  "quiz-valut"?: boolean;
};

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
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

export default function NewTestSteps({
  steps,
  columns = 5,
  nextConnector = false,
}: {
  steps: Step[];
  columns?: number;
  nextConnector?: boolean;
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

        return (
          <div
            key={rowIndex}
            className={`relative grid grid-cols-[repeat(var(--ts-cols),minmax(0,1fr))] gap-5 ${showConnectorBelow ? "md:mb-16" : ""}`}
            style={{ "--ts-cols": effectiveColumns } as React.CSSProperties}
          >
            <div
              className={`before_row pointer-events-none absolute -top-11.75 h-30.5 w-20 border-solid border-white max-md:hidden ${
                rowIndex === 0
                  ? "left-0 border-b"
                  : "-left-10 rounded-l-[28px] border-14 border-r-0"
              }`}
            />
            {showConnectorBelow && (
              <div
                className={`after_row pointer-events-none absolute top-15.25 h-[calc(100%-30px)] -right-10 rounded-r-[28px] border-14 border-solid border-white border-l-0 max-md:hidden ${
                  shrinkConnectorBelow ? "left-15" : "w-full"
                }`}
                style={
                  shrinkConnectorBelow
                    ? {
                        width: `calc(${rowWidth(effectiveColumns, rowSpan)} - 20px)`,
                      }
                    : undefined
                }
              />
            )}

            {row.map((step, index) => (
              <div
                key={index}
                className={`group flex md:flex-col items-center md:items-start cursor-pointer rounded transition-all duration-300 hover:-translate-y-0.75 ${
                  step.style === "large" ? "lg:col-span-2" : ""
                }`}
              >
                <div className="md:hidden md:w-15 w-8.5 absolute left-6.5 ms-auto md:border-l-14 border-l-8 top-4 border-white h-full z-0" />
                {(step.image ||
                  step.type === "premium" ||
                  step.status === "next" ||
                  step.type === "free") && (
                  <div
                    className={`relative overflow-hidden md:rounded-xl rounded-md md:max-w-full ${
                      step["quiz-valut"] ? "w-full" : "max-w-35"
                    }`}
                  >
                    {step.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={step.image}
                        alt=""
                        className="md:h-32 h-18 w-full md:rounded-xl rounded-md object-cover transition-all duration-300"
                      />
                    )}
                    {(step.type === "premium" || step.status === "next") && (
                      <div
                        className={`absolute inset-0 flex items-center justify-center md:rounded-xl rounded-md ${
                          step.type === "premium"
                            ? "bg-white/60 backdrop-blur-[2px] group-hover:bg-linear-to-r group-hover:from-blue-500 group-hover:to-blue-700"
                            : ""
                        }`}
                      >
                        {step.type === "premium" && (
                          <>
                            <div className="flex h-8 w-8 items-center justify-center rounded-4xl group-hover:hidden">
                              <Gem className="text-blue-600 w-8 h-8 " />
                            </div>
                            <div className="hidden group-hover:flex px-2">
                              <Button
                                variant="outline"
                                className="w-full md:w-fit bg-yellow-500! border-yellow-500!"
                                size="sm"
                              >
                                <Gem /> Upgrade to Premium
                              </Button>
                            </div>
                          </>
                        )}
                        {step.status === "next" && (
                          <Paragraph
                            size="sm"
                            color="primary"
                            className="rounded-full bg-white px-3 py-0.5 font-semibold"
                          >
                            Next
                          </Paragraph>
                        )}
                      </div>
                    )}
                    {step.type === "free" && (
                      <Paragraph
                        color="white"
                        size="xs"
                        className="absolute md:top-2 top-0.5 rounded-sm px-1.75 md:py-0.5 font-semibold md:tracking-wide uppercase md:right-2 right-0.5 bg-green-500"
                      >
                        Free
                      </Paragraph>
                    )}
                  </div>
                )}
                {(step.title || step.totalQuestions || step.totalTime) && (
                  <div className="md:p-4 px-3 md:space-y-2">
                    {step.title && (
                      <Paragraph color="dark" className="font-semibold">
                        {step.title}
                      </Paragraph>
                    )}
                    {(step.totalQuestions || step.totalTime) && (
                      <Paragraph
                        color="primary"
                        size="sm"
                        className="font-semibold"
                      >
                        {step.totalQuestions &&
                          `${step.totalQuestions} questions`}
                        {step.totalQuestions && step.totalTime && " · ~"}
                        {step.totalTime && `${step.totalTime} min`}
                      </Paragraph>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
