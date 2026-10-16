"use client";

import { Bookmark, Check, RefreshCw, X } from "lucide-react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";

const STEPS = [
  {
    icon: X,
    tone: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
    title: "Miss a question",
    body: "It's saved to your vault automatically.",
  },
  {
    icon: RefreshCw,
    tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    title: "Retest only your weak spots",
    body: "Short rounds, no repeats of what you already know.",
  },
  {
    icon: Check,
    tone: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
    title: "Get it right, it's mastered",
    body: "Miss it again and it simply goes back in.",
  },
];

export default function QuizVaultSection() {
  return (
    <section className="bg-background px-5 py-15 lg:py-28">
      <div className="mx-auto flex max-w-container flex-col gap-12 lg:flex-row lg:items-center lg:gap-15">
        <div className="w-full lg:max-w-120 lg:shrink-0">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">
            The quiz vault
          </p>
          <Heading as="h2" size="md" weight="bold" className="mt-3 max-w-112">
            Every question you miss comes back until you own it
          </Heading>
          <Paragraph color="muted" className="mt-5">
            No shame, we all have weak spots. The vault catches them for you. Try a round on the right.
          </Paragraph>

          <ol className="relative mt-8 space-y-6">
            <span
              aria-hidden
              className="absolute top-9 bottom-9 left-4.5 border-l-2 border-dotted border-neutral-300 dark:border-neutral-600"
            />
            {STEPS.map(({ icon: Icon, tone, title, body }) => (
              <li key={title} className="relative flex items-start gap-4">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-bold text-neutral-900 dark:text-neutral-100">{title}</p>
                  <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{body}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-6 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <Bookmark className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            Bookmark any question to save it for later, too.
          </p>
        </div>

        <div className="w-full min-w-0 lg:flex lg:flex-1 lg:justify-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/state-hub/quiz-vault.png"
            alt="Your vault: missed questions waiting to be retested, with a sample four-way stop question"
            className="w-full max-w-162 rounded-[28px] shadow-hover"
          />
        </div>
      </div>
    </section>
  );
}
