"use client";

import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { stateToSlug } from "@/lib/usStates";

type Pass = {
  name: string;
  state: string;
  minutesAgo: number;
  initials: string;
  tint: string;
};

const recentPasses: Pass[] = [
  {
    name: "Maria R.",
    state: "Texas",
    minutesAgo: 2,
    initials: "MR",
    tint: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
  },
  {
    name: "Devon K.",
    state: "Ohio",
    minutesAgo: 4,
    initials: "DK",
    tint: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  },
  {
    name: "Aisha M.",
    state: "Georgia",
    minutesAgo: 6,
    initials: "AM",
    tint: "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400",
  },
  {
    name: "James T.",
    state: "Florida",
    minutesAgo: 8,
    initials: "JT",
    tint: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  },
  {
    name: "Sarah L.",
    state: "Washington",
    minutesAgo: 11,
    initials: "SL",
    tint: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  },
];

function formatElapsed(minutes: number): string {
  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 min ago";
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  return hours === 1 ? "1 hr ago" : `${hours} hrs ago`;
}

export default function RecentPasses() {

  const [minutesOnPage, setMinutesOnPage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setMinutesOnPage((m) => m + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      aria-labelledby="recent-passes-heading"
      className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-card lg:p-6 dark:border-white/10 dark:bg-neutral-800"
    >
      <div className="flex items-center justify-between gap-3">
        <h3
          id="recent-passes-heading"
          className="font-sora text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100"
        >
          Recent passes
        </h3>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-500/15 dark:text-green-400">
          <span className="relative flex size-2" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75 motion-reduce:hidden" />
            <span className="relative inline-flex size-2 rounded-full bg-green-500" />
          </span>
          Live
        </span>
      </div>

      <ul className="mt-2 divide-y divide-neutral-100 dark:divide-white/10">
        {recentPasses.map((pass) => {
          const elapsed = formatElapsed(pass.minutesAgo + minutesOnPage);

          return (
            <li key={`${pass.name}-${pass.state}`}>
              <Link
                href={`/${stateToSlug(pass.state)}`}
                aria-label={`${pass.name} passed in ${pass.state} ${elapsed} — see the ${pass.state} test guide`}
                className="group flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-blue-50/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:hover:bg-blue-500/10"
              >
                <span
                  aria-hidden
                  className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${pass.tint}`}
                >
                  {pass.initials}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {pass.name} <span className="text-neutral-400">–</span> {pass.state}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    <span
                      aria-hidden
                      className="grid size-4 shrink-0 place-items-center rounded-full bg-green-600"
                    >
                      <Check className="size-2.5 stroke-3 text-white" />
                    </span>
                    Passed {elapsed}
                  </span>
                </span>

                <ChevronRight
                  aria-hidden
                  className="size-4 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500 dark:text-neutral-600"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
