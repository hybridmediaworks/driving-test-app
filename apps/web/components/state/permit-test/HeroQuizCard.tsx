"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const OPTIONS = ["A", "B", "C"] as const;
const CORRECT = "C";

export default function HeroQuizCard({ href }: { href: string }) {
  const [picked, setPicked] = useState<string | null>(null);
  const answered = picked !== null;

  return (
    <div className="absolute -bottom-12 left-3 md:-left-6 w-[calc(100%-24px)] md:w-max rounded-2xl bg-white dark:bg-neutral-800 p-4 md:p-5 shadow-hover">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">
        Try one now
      </p>
      <p className="mt-2 text-sm md:text-base md:whitespace-nowrap font-bold text-neutral-900 dark:text-neutral-100">
        All three arrive together. Who goes first?
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {OPTIONS.map((option) => {
          const tone = !answered
            ? "border-border bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"
            : option === CORRECT
              ? "border-green-500 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
              : option === picked
                ? "border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                : "border-border bg-white dark:bg-neutral-900 text-neutral-400";

          return (
            <button
              key={option}
              type="button"
              disabled={answered}
              onClick={() => setPicked(option)}
              className={`h-11 rounded-lg border text-sm font-bold transition-colors disabled:cursor-default ${tone}`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {answered && (
        <p aria-live="polite" className="mt-3 w-0 min-w-full text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            {picked === CORRECT ? "Correct! " : "Not quite. "}
          </span>
          C has no car on its right, so it goes first.{" "}
          <Link href={href} className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
            Keep practicing <ArrowRight className="h-4 w-4" />
          </Link>
        </p>
      )}
    </div>
  );
}
