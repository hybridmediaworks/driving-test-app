"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Car, Check, Flag, Gem, Lock } from "lucide-react";
import { isMarathonStep, type PhaseLadderStep } from "@/lib/phaseLadder";
import type { StageTone } from "@/components/state/permit-test/StudyRouteSection";

export function stepHref(step: PhaseLadderStep, stateSlug?: string): string | null {
  if (step.locked) return step.lockMode === "premium" ? "/pricing" : null;
  return stateSlug && step.slug ? `/${stateSlug}/${step.slug}` : null;
}

export function stepMeta(step: PhaseLadderStep, timePrefix = "~"): string {
  return [
    step.totalQuestions ? `${step.totalQuestions} questions` : null,
    step.totalTime ? `${timePrefix}${step.totalTime} min` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

const badgeBase = "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide";

function AccessBadge({ type }: { type?: "free" | "premium" }) {
  if (type === "free") return <span className={`${badgeBase} bg-green-500 text-white`}>Free</span>;
  if (type === "premium") return <span className={`${badgeBase} bg-orange-500 text-white`}>Premium</span>;
  return null;
}

export default function StudyRouteStepRow({
  step,
  index,
  tone,
  isCurrent,
  stageLocked,
  showAccessTag,
  stateSlug,
}: {
  step: PhaseLadderStep;
  index: number;
  tone: StageTone;
  isCurrent: boolean;
  stageLocked: boolean;
  showAccessTag: boolean;
  stateSlug?: string;
}) {
  const marathon = isMarathonStep(step);
  const lockedPremium = !!step.locked && step.lockMode === "premium";
  const done = !!step.completed && !isCurrent;
  const href = stepHref(step, stateSlug);

  const circle = isCurrent ? (
    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white ring-6 ring-blue-100 dark:ring-blue-500/20">
      <Car className="h-4.5 w-4.5" />
    </span>
  ) : done ? (
    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-500 text-white">
      <Check className="h-4.5 w-4.5" strokeWidth={3} />
    </span>
  ) : marathon ? (
    <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-neutral-300 bg-white text-neutral-500 dark:border-neutral-600 dark:bg-neutral-800">
      <Flag className="h-4 w-4" />
    </span>
  ) : step.locked && !stageLocked ? (
    <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10">
      <Lock className="h-3.5 w-3.5" />
    </span>
  ) : (
    <span
      className={`flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white font-mono text-xs font-semibold dark:bg-neutral-800 ${
        stageLocked ? tone.ring : "border-neutral-200 text-neutral-600 dark:border-neutral-600 dark:text-neutral-300"
      }`}
    >
      {String(index + 1).padStart(2, "0")}
    </span>
  );

  const actionLabel = step.inProgress ? "Continue" : done ? "Retake" : "Start";

  const body: ReactNode = (
    <>
      <div
        className={`relative hidden shrink-0 overflow-hidden rounded-lg sm:block ${isCurrent ? "h-18 w-41" : "h-11 w-26"}`}
      >
        {step.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={step.image} alt="" className="h-full w-full object-cover" />
        )}
        {step.locked && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] dark:bg-neutral-900/60">
            {lockedPremium ? (
              <Gem className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <Lock className="h-4 w-4 text-neutral-600" />
            )}
          </span>
        )}
        {showAccessTag && step.type && (
          <span
            className={`absolute left-1 top-1 rounded-sm px-1 py-0.5 text-[7px] font-bold uppercase leading-none text-white ${
              step.type === "free" ? "bg-green-500" : "bg-orange-500"
            }`}
          >
            {step.type}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {isCurrent && (
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold leading-none text-white">
              You are here
            </span>
            {showAccessTag && <AccessBadge type={step.type} />}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={`font-semibold ${isCurrent ? "text-lg" : "text-base"} ${
              step.locked ? "text-neutral-700 dark:text-neutral-300" : "text-neutral-900 dark:text-neutral-100"
            }`}
          >
            {step.title}
          </span>
          {!isCurrent && marathon && (
            <span className={`${badgeBase} bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100`}>
              Marathon
            </span>
          )}
          {!isCurrent && showAccessTag && <AccessBadge type={step.type} />}
        </div>
        <p
          className={`mt-0.5 text-sm ${isCurrent ? "text-blue-600 dark:text-blue-400" : "text-neutral-500 dark:text-neutral-400"}`}
        >
          {step.inProgress ? `Continue: ${step.inProgress.answered}/${step.inProgress.total} · ` : ""}
          {stepMeta(step)}
        </p>
      </div>

      {!step.locked &&
        (isCurrent ? (
          <span className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-xs transition-colors group-hover:bg-blue-700">
            {actionLabel} <ArrowRight className="h-4 w-4" />
          </span>
        ) : (
          <span className="inline-flex h-10 shrink-0 items-center rounded-xl border border-border bg-white px-4 text-sm font-bold text-neutral-900 shadow-xs transition-colors group-hover:border-blue-500 group-hover:text-blue-600 dark:bg-neutral-800 dark:text-neutral-100">
            {actionLabel}
          </span>
        ))}
    </>
  );

  const bodyClass = `group flex min-w-0 flex-1 items-center gap-3 sm:gap-4 ${
    isCurrent
      ? "rounded-2xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-500/20 dark:bg-blue-500/10"
      : "py-1"
  }`;

  return (
    <li className="relative flex items-center gap-3 sm:gap-4">
      <span className="relative z-10 shrink-0">{circle}</span>
      {href ? (
        <Link href={href} className={bodyClass}>
          {body}
        </Link>
      ) : (
        <div className={bodyClass}>{body}</div>
      )}
    </li>
  );
}
