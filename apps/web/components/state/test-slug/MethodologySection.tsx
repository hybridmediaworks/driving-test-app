"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  Expert,
  Handbook,
  PaginatedResponse,
  State,
} from "@driving-test-app/shared";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { api } from "@/lib/api";
import {
  TRUSTPILOT_MAX,
  TRUSTPILOT_REVIEW_COUNT,
  TRUSTPILOT_SCORE,
} from "@/lib/socialProof";
import { stateAbbreviations } from "@/lib/usStates";
import { useExperts } from "@/lib/useExperts";
import { useWebLayout } from "@/lib/web-layout-context";
import { BookOpen, Check, Star, X } from "lucide-react";

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

type Reviewer = {
  name: string;
  role: string;
  quote: string;
  photo: string;
  /** Used when `photo` fails to load — a published photo can point at media this environment
   * doesn't have. */
  fallbackPhoto?: string;
  /** Only real roster entries link through to a profile. */
  href?: string;
};

/**
 * The pair from the Figma frame (node 4268:11928), portraits included. Designer placeholder
 * content — it only shows while the published roster (GET /experts) is empty, exactly as
 * components/state/ExpertsSection.tsx does. Publish the real reviewers in /admin/experts and they
 * replace this with no code change.
 */
const DESIGN_REVIEWERS: Reviewer[] = [
  {
    name: "Marcus Doyle",
    role: "Former DMV Examiner",
    quote:
      "The questions hit the same reasoning patterns we use on the actual exam. Students who practice here walk in prepared.",
    photo: "/test-slug/reviewer-examiner.webp",
  },
  {
    name: "Maria Garsa",
    role: "Driving Instructor, Charleston",
    quote:
      "The questions hit the same reasoning patterns we use on the actual exam. Students who practice here walk in prepared.",
    photo: "/test-slug/reviewer-instructor.webp",
  },
];

/** Bundled stand-ins for roster entries whose photo hasn't been published yet, keyed by slug so a
 * stock face can never drift onto a different person — same table as ExpertsSection. */
const PLACEHOLDER_PHOTOS: Record<string, string> = {
  "marcus-reyes": "/state-hub/expert-instructor.jpg",
  "dana-whitfield": "/state-hub/expert-examiner.jpg",
};

/** The reviewer's own words, from their published profile — first paragraph only, since the card
 * has room for a pull quote rather than the whole write-up. */
function quoteOf(expert: Expert, index: number): string {
  const first = (expert.intro ?? "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .find(Boolean);

  return first ?? DESIGN_REVIEWERS[index]?.quote ?? "";
}

function toReviewer(expert: Expert, index: number): Reviewer {
  return {
    name: expert.name,
    role: expert.role_label ?? expert.title,
    quote: quoteOf(expert, index),
    photo:
      expert.photo_url ??
      PLACEHOLDER_PHOTOS[expert.slug] ??
      DESIGN_REVIEWERS[index]?.photo ??
      "",
    fallbackPhoto:
      PLACEHOLDER_PHOTOS[expert.slug] ?? DESIGN_REVIEWERS[index]?.photo,
    href: `/experts/${expert.slug}`,
  };
}

/**
 * "Checked against the handbook, every week" — two reviewer cards flanking the navy methodology
 * panel (Figma node 4268:11928). The sources line links the state's real handbook and DMV site;
 * the rating quotes the site's published Trustpilot figures.
 */
export default function MethodologySection() {
  const { selectedState, selectedVehicle } = useWebLayout();
  const stateCode = stateAbbreviations[selectedState] ?? "";
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";
  const experts = useExperts();
  const [profiles, setProfiles] = useState<Expert[]>([]);
  const [handbook, setHandbook] = useState<Handbook | null>(null);
  const [stateInfo, setStateInfo] = useState<State | null>(null);

  // The roster endpoint carries names and photos but not the write-ups, so each profile is
  // fetched for the pull quote — otherwise both cards would show the same generic line.
  const slugs = experts
    .slice(0, 2)
    .map((expert) => expert.slug)
    .join(",");

  useEffect(() => {
    if (!slugs) return;
    let cancelled = false;

    Promise.all(
      slugs
        .split(",")
        .map((slug) =>
          api
            .get<{ expert: Expert }>(`/experts/${slug}`)
            .then((res) => res.expert),
        ),
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

  useEffect(() => {
    if (!stateCode) return;
    let cancelled = false;

    api
      .get<PaginatedResponse<Handbook>>(
        `/handbooks?state=${stateCode}&vehicle_type=${vehicleType}`,
      )
      .then((res) => {
        if (!cancelled) setHandbook(res.data[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setHandbook(null);
      });

    api
      .get<{ data: State[] }>("/states")
      .then((res) => {
        if (!cancelled)
          setStateInfo(res.data.find((s) => s.code === stateCode) ?? null);
      })
      .catch(() => {
        if (!cancelled) setStateInfo(null);
      });

    return () => {
      cancelled = true;
    };
  }, [stateCode, vehicleType]);

  const agencyName = stateInfo?.agency_name ?? "DMV";
  const reviewers =
    profiles.length >= 2
      ? profiles.slice(0, 2).map(toReviewer)
      : DESIGN_REVIEWERS;
  const [first, second] = reviewers;

  const methods = [
    {
      icon: Check,
      tone: "bg-blue-500",
      title: "What we use",
      // The published handbook title already carries the state name.
      body: `The current ${handbook?.title ?? `${selectedState} Driver’s Manual`}, the knowledge-test overview, fee and ID requirements, and ${agencyName} office/appointment info.`,
    },
    {
      icon: BookOpen,
      tone: "bg-purple-500",
      title: "How we make them exam-like",
      body: "We mirror recurring themes — right-of-way traps, sign look-alikes — and use similar distractors and wording to the real exam.",
    },
    {
      icon: X,
      tone: "bg-red-500",
      title: "What we don’t do",
      body: `We don’t collect or publish actual test items, and we are not affiliated with the ${agencyName} or any government agency.`,
    },
  ];

  return (
    <section className="bg-background2 px-5 py-15 lg:py-30">
      <div className="mx-auto flex max-w-container flex-col items-center gap-15">
        <div className="flex max-w-205 flex-col items-center gap-6 text-center">
          <Heading as="h2" className="text-center">
            Checked against the handbook, every week
          </Heading>
          <Paragraph size="lg" className="max-w-153.5 text-center">
            Real people verify every state’s questions against the official
            manual — so what you practice matches what you’ll be tested on.
          </Paragraph>
        </div>

        <div className="grid w-full grid-cols-1 items-stretch gap-5 lg:grid-cols-[minmax(0,325fr)_minmax(0,670fr)_minmax(0,325fr)]">
          <ReviewerCard reviewer={first} />

          {/* Navy methodology panel — the centre of the trio on desktop, first on mobile so the
              substance comes before the portraits. */}
          <div className="order-first flex flex-col justify-between gap-8 rounded-[32px] bg-[linear-gradient(118deg,#0d142c_0%,#172554_100%)] p-8 drop-shadow-[0px_30px_32px_rgba(16,24,40,0.3),0px_8px_9px_rgba(16,24,40,0.07)] lg:order-none lg:p-10">
            <div className="space-y-4">
              <h3 className="font-sora text-3xl leading-11 font-semibold text-white">
                How we build these questions
              </h3>
              <div className="space-y-5">
                {methods.map((method) => (
                  <div key={method.title} className="flex items-start gap-4">
                    <span
                      className={`flex size-6.5 shrink-0 items-center justify-center rounded-lg ${method.tone}`}
                    >
                      <method.icon className="size-3.5 text-white" />
                    </span>
                    <div className="flex-1 space-y-1.5">
                      <p className="font-sora text-base leading-6 font-semibold tracking-[-0.32px] text-white">
                        {method.title}
                      </p>
                      <p className="text-sm leading-6 text-white/60">
                        {method.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-6 border-t border-white/12 pt-4">
              <div className="flex flex-col justify-center gap-3.5">
                <div className="flex gap-0.5" aria-hidden="true">
                  {Array.from({ length: TRUSTPILOT_MAX }).map((_, i) => (
                    <Star
                      key={i}
                      className="size-4.5 fill-yellow-500 text-yellow-500"
                      strokeWidth={0}
                    />
                  ))}
                </div>
                <p className="flex items-baseline gap-3.5">
                  <span className="font-sora text-[28px] leading-6 font-semibold tracking-[-0.56px] text-white">
                    {TRUSTPILOT_SCORE}
                  </span>
                  <span className="text-[13px] leading-6 text-white/60">
                    / {TRUSTPILOT_MAX} · {TRUSTPILOT_REVIEW_COUNT} students
                  </span>
                </p>
              </div>

              <p className="max-w-71.75 text-[13px] leading-6 text-white/60">
                Official sources we check:{" "}
                {handbook ? (
                  <Link
                    href={`/handbook/${handbook.id}`}
                    className="text-white underline"
                  >
                    {handbook.title}
                  </Link>
                ) : (
                  <span className="text-white">
                    the official {selectedState} driver handbook
                  </span>
                )}
                {stateInfo?.dmv_website_url && (
                  <>
                    {" · "}
                    <a
                      href={stateInfo.dmv_website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white underline"
                    >
                      {selectedState} {agencyName} website
                    </a>
                  </>
                )}
              </p>
            </div>
          </div>

          <ReviewerCard reviewer={second} />
        </div>
      </div>
    </section>
  );
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * The reviewer's own photo, then the bundled stand-in, then their initials. A published photo can
 * point at media this environment can't serve — an upload whose derived conversion never landed,
 * say — and a broken-image glyph in the middle of the card reads far worse than a placeholder.
 * Failures are tracked by src rather than as a flag, so a later swap (a real photo finally being
 * published) still gets its own chance to load.
 */
function ReviewerPhoto({ reviewer }: { reviewer: Reviewer }) {
  const [failed, setFailed] = useState<string[]>([]);
  const candidates = [reviewer.photo, reviewer.fallbackPhoto].filter(
    (src): src is string => Boolean(src),
  );
  const src = candidates.find((candidate) => !failed.includes(candidate));

  if (!src) {
    return (
      <div
        aria-hidden
        // Keeps what was tried inspectable — the <img> is unmounted on error, so there is
        // otherwise nothing left in the DOM to check.
        data-photo-src={reviewer.photo || undefined}
        data-photo-state={candidates.length > 0 ? "failed" : "missing"}
        className="flex h-61 w-full items-center justify-center rounded-3xl bg-background2 font-sora text-5xl font-semibold text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400"
      >
        {initialsOf(reviewer.name)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      onError={() => setFailed((prev) => [...prev, src])}
      className="h-61 w-full rounded-3xl object-cover"
    />
  );
}

/** One reviewer portrait card: photo, pull quote, name and role. */
function ReviewerCard({ reviewer }: { reviewer: Reviewer | undefined }) {
  if (!reviewer) return null;

  const body = (
    <>
      <ReviewerPhoto reviewer={reviewer} />
      <div className="flex flex-col gap-6 px-2">
        {/* A published write-up can run long; the card has room for a pull quote, not the whole
            profile — the rest is on /experts/{slug}, which the card links to. */}
        <Paragraph className="line-clamp-5">“{reviewer.quote}”</Paragraph>
        <div>
          <p className="font-sora text-2xl leading-8 font-semibold text-neutral-900 dark:text-neutral-100">
            {reviewer.name}
          </p>
          <Paragraph>{reviewer.role}</Paragraph>
        </div>
      </div>
    </>
  );

  const className =
    "flex flex-col gap-8 overflow-hidden rounded-[32px] border border-background2 bg-white dark:bg-neutral-800 px-4 pt-4 pb-8 shadow-[0px_4px_24px_0px_rgba(157,175,181,0.25)]";

  return reviewer.href ? (
    <Link href={reviewer.href} className={className}>
      {body}
    </Link>
  ) : (
    <article className={className}>{body}</article>
  );
}
