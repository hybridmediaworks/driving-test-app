"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Check, Flag, ShieldCheck } from "lucide-react";
import type { Expert } from "@driving-test-app/shared";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { api } from "@/lib/api";
import { useExperts } from "@/lib/useExperts";
import { stateAbbreviations } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

type Reviewer = {
  name: string;
  role: string;
  checks: string[];
  photo: string | null;
  /** Bundled stand-in used when `photo` is absent or fails to load. */
  fallbackPhoto?: string;
  href?: string;
};

/**
 * Stand-in portraits, keyed by reviewer slug, for while the real photos are missing from media
 * storage. These are the design's stock portraits, not photographs of the named reviewers — a
 * deliberate, temporary placeholder, only reached when the API has no working photo for that person.
 */
const PLACEHOLDER_PHOTOS: Record<string, string> = {
  "marcus-reyes": "/state-hub/expert-instructor.jpg",
  "dana-whitfield": "/state-hub/expert-examiner.jpg",
};

/**
 * Designer copy, shown only while the published roster (GET /experts) is empty. Publish the real
 * reviewers in /admin/experts before this reaches production.
 */
const DESIGN_REVIEWERS: Reviewer[] = [
  {
    name: "Marcus Reyes",
    role: "Legal & handbook accuracy",
    checks: [
      "Maps every question to its handbook passage",
      "Edits question banks for accuracy across all 50 states",
      "Signs off each state's content before it goes live",
    ],
    photo: "/state-hub/expert-instructor.jpg",
  },
  {
    name: "Dana Whitfield",
    role: "Test design & learning",
    checks: [
      "How each practice test is structured",
      "The order you take them in, and how they're scored",
      "That study time maps to real exam readiness",
    ],
    photo: "/state-hub/expert-examiner.jpg",
  },
];

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function firstName(name: string): string {
  return name.split(/\s+/)[0] ?? name;
}

function checksFrom(expert: Expert): string[] {
  const section =
    expert.sections.find((s) => /check|review|focus|responsib/i.test(s.heading)) ?? expert.sections[0];
  if (!section) return [];
  return section.body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .slice(0, 3);
}

function toReviewer(expert: Expert): Reviewer {
  return {
    name: expert.name,
    role: expert.role_label ?? expert.title,
    checks: checksFrom(expert),
    photo: expert.photo_url,
    fallbackPhoto: PLACEHOLDER_PHOTOS[expert.slug],
    href: `/experts/${expert.slug}`,
  };
}

/**
 * Photo when there is one, initials when there isn't — never a stock face under a real name.
 * Also falls back to initials when the photo fails to load.
 */
function ReviewerPhoto({ reviewer, className }: { reviewer: Reviewer; className: string }) {
  const [failed, setFailed] = useState<string[]>([]);
  const candidates = [reviewer.photo, reviewer.fallbackPhoto].filter((src): src is string => Boolean(src));
  const src = candidates.find((candidate) => !failed.includes(candidate));

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={reviewer.name}
        onError={() => setFailed((prev) => [...prev, src])}
        className={`${className} object-cover object-top`}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={`${className} flex items-center justify-center bg-background2 font-sora font-semibold text-neutral-500 dark:text-neutral-400`}
    >
      {initialsOf(reviewer.name)}
    </div>
  );
}

function SignedOff() {
  return (
    <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
      Signed off
    </span>
  );
}

export default function ExpertsSection() {
  const { selectedState } = useWebLayout();
  const stateCode = stateAbbreviations[selectedState] ?? "";
  const summaries = useExperts();
  const [profiles, setProfiles] = useState<Expert[]>([]);

  const slugs = summaries
    .slice(0, 2)
    .map((s) => s.slug)
    .join(",");

  useEffect(() => {
    if (!slugs) return;
    let cancelled = false;

    Promise.all(
      slugs.split(",").map((slug) => api.get<{ expert: Expert }>(`/experts/${slug}`).then((res) => res.expert)),
    )
      .then((result) => {
        if (!cancelled) setProfiles(result);
      })
      .catch(() => {
        if (!cancelled) setProfiles([]);
      });

    return () => {
      cancelled = true;
    };
  }, [slugs]);

  const reviewers = profiles.length >= 2 ? profiles.map(toReviewer) : DESIGN_REVIEWERS;
  const [accuracy, design] = reviewers;

  const steps = [
    {
      key: "source",
      marker: (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <BookOpen className="h-4 w-4" />
        </span>
      ),
      title: "Sourced from the handbook",
      body: (
        <span className="mt-1 inline-block rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
          {stateCode} Driver Guide › Rules of the road › Right-of-way
        </span>
      ),
    },
    {
      key: "accuracy",
      marker: <ReviewerPhoto reviewer={accuracy} className="h-9 w-9 rounded-full text-xs" />,
      title: "Checked for accuracy",
      body: `${firstName(accuracy.name)} confirms the answer matches the handbook.`,
      signedOff: true,
    },
    {
      key: "route",
      marker: <ReviewerPhoto reviewer={design} className="h-9 w-9 rounded-full text-xs" />,
      title: "Placed in the route",
      body: `${firstName(design.name)} decides which test it belongs in and how it's scored.`,
      signedOff: true,
    },
    {
      key: "live",
      marker: (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-700 text-white">
          <Flag className="h-4 w-4" />
        </span>
      ),
      title: "Live in your practice tests",
      body: "Only after both sign-offs.",
    },
  ];

  return (
    <section className="bg-background2 px-5 py-15 lg:py-28">
      <div className="mx-auto max-w-container">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-155">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-green-700 dark:text-green-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Expert reviewed
            </p>
            <Heading as="h2" size="md" weight="bold" className="mt-3">
              Checked by people who know the test
            </Heading>
          </div>
          <Paragraph color="muted" className="max-w-100">
            Every question is tied to its source in the {selectedState} handbook and signed off by a person before you
            ever see it.
          </Paragraph>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="rounded-3xl border border-border bg-white p-5 shadow-xs md:p-6 dark:bg-neutral-800">
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold text-neutral-900 dark:text-neutral-100">How a question gets onto this page</p>
              <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                Example
              </span>
            </div>

            <div className="mt-5 rounded-2xl bg-background2 p-5">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Traffic laws · Right-of-way</p>
              <p className="mt-2 font-bold text-neutral-900 dark:text-neutral-100">
                Two cars reach a four-way stop at the same time. Who goes first?
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-green-500 bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
                <Check className="h-3.5 w-3.5" />
                The car on the right
              </span>
            </div>

            <ol className="relative mt-6 space-y-5">
              <span
                aria-hidden
                className="absolute top-9 bottom-9 left-4.25 border-l-2 border-dotted border-neutral-300 dark:border-neutral-600"
              />
              {steps.map((step) => (
                <li key={step.key} className="relative flex items-center gap-3 sm:gap-4">
                  <span className="relative shrink-0">{step.marker}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{step.title}</p>
                    {typeof step.body === "string" ? (
                      <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{step.body}</p>
                    ) : (
                      step.body
                    )}
                  </div>
                  {step.signedOff && <SignedOff />}
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {[accuracy, design].map((reviewer) => (
              <article
                key={reviewer.name}
                className="rounded-3xl border border-border bg-white p-3 pb-5 shadow-xs dark:bg-neutral-800"
              >
                <div className="flex items-center gap-4">
                  <ReviewerPhoto reviewer={reviewer} className="h-24 w-21 shrink-0 rounded-2xl text-2xl" />
                  <div className="min-w-0">
                    {reviewer.href ? (
                      <Link
                        href={reviewer.href}
                        className="font-sora text-lg font-bold text-neutral-900 hover:underline dark:text-neutral-100"
                      >
                        {reviewer.name}
                      </Link>
                    ) : (
                      <p className="font-sora text-lg font-bold text-neutral-900 dark:text-neutral-100">
                        {reviewer.name}
                      </p>
                    )}
                    <span className="mt-1.5 inline-block rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
                      {reviewer.role}
                    </span>
                  </div>
                </div>
                {reviewer.checks.length > 0 && (
                  <div className="px-2 pt-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">What they check</p>
                    <ul className="mt-2 space-y-2">
                      {reviewer.checks.map((check) => (
                        <li key={check} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
                          {check}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
