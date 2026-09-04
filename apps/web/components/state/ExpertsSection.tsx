"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Expert } from "@driving-test-app/shared";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { api } from "@/lib/api";
import { useExperts } from "@/lib/useExperts";

type Reviewer = {
  name: string;
  role: string;
  /** One or more paragraphs of the reviewer's write-up. */
  quote: string[];
  photo: string | null;
  /** Bundled stand-in used when `photo` is absent or fails to load. */
  fallbackPhoto?: string;
  /** Profile link — only real roster entries have one. */
  href?: string;
};

/**
 * Stand-in portraits, keyed by reviewer slug, for while the real photos are missing from media
 * storage. These are the design's stock portraits, not photographs of the named reviewers — a
 * deliberate, temporary placeholder. They are only ever reached when the API has no working photo
 * for that person, so publishing a real photo in /admin/experts replaces them with no code change.
 * Keyed by slug rather than by card position so a stock face can never silently attach itself to
 * a reviewer added later.
 */
const PLACEHOLDER_PHOTOS: Record<string, string> = {
  "marcus-reyes": "/state-hub/expert-instructor.jpg",
  "dana-whitfield": "/state-hub/expert-examiner.jpg",
};

/**
 * Verbatim from the design (Figma node 4147:8464), including its portraits. This is designer
 * placeholder copy — both cards carry the same name in the file — so it only shows while the real
 * published roster is empty (GET /experts). Replace it, or publish the real reviewers in
 * /admin/experts, before this reaches production.
 */
const DESIGN_REVIEWERS: Reviewer[] = [
  {
    name: "Marcus Doyle",
    role: "Driving Instructor, Charleston",
    quote: [
      "I recommend this simulator to every student preparing for an important exam. It provides a realistic testing experience that goes far beyond simply working through practice questions. You get to experience the timing, pressure, and structure of a real test, making the actual test day feel much less intimidating.",
      "Using the simulator helped me become more comfortable with the testing process and gave me a better understanding of where I needed to improve. In my opinion, it does more to reduce test-day anxiety than any packet of practice questions ever could. I highly recommend it.",
    ],
    photo: "/state-hub/expert-instructor.jpg",
  },
  {
    name: "Marcus Doyle",
    role: "Former DMV Examiner",
    quote: [
      "“The questions hit the same reasoning patterns we use on the actual exam. Students who practice here walk in prepared.”",
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

function toReviewer(expert: Expert): Reviewer {
  return {
    name: expert.name,
    role: expert.role_label ?? expert.title,
    quote: (expert.intro ?? "")
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .slice(0, 2),
    photo: expert.photo_url,
    fallbackPhoto: PLACEHOLDER_PHOTOS[expert.slug],
    href: `/experts/${expert.slug}`,
  };
}

/**
 * Photo when there is one, initials when there isn't — never a stock face under a real name.
 * Also falls back to initials when the photo fails to load: a reviewer's media can be stored on a
 * disk the app isn't serving (an upload that landed on the local disk while the rest of the
 * library is on S3, say), and a broken-image glyph under someone's name reads far worse than
 * their initials.
 */
function ReviewerPhoto({
  reviewer,
  className,
}: {
  reviewer: Reviewer;
  className: string;
}) {
  // The reviewer's own photo first, then the bundled stand-in, then initials. Failures are tracked
  // by src rather than as a bare flag so a later swap (the design fallback giving way to the real
  // roster, or a real photo finally being published) gets its own chance to load.
  const [failed, setFailed] = useState<string[]>([]);
  const candidates = [reviewer.photo, reviewer.fallbackPhoto].filter(
    (src): src is string => Boolean(src),
  );
  const src = candidates.find((candidate) => !failed.includes(candidate));

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={reviewer.name}
        onError={() => setFailed((prev) => [...prev, src])}
        className={`${className} object-cover`}
      />
    );
  }

  return (
    <div
      aria-hidden
      // Carries whatever was tried so the placeholder stays inspectable — the <img> is unmounted
      // on error, so there is otherwise nothing in the DOM to check.
      data-photo-src={reviewer.photo ?? undefined}
      data-photo-state={candidates.length > 0 ? "failed" : "missing"}
      className={`${className} flex items-center justify-center bg-background2 font-sora text-5xl font-semibold text-neutral-500`}
    >
      {initialsOf(reviewer.name)}
    </div>
  );
}

function ReviewerName({ reviewer }: { reviewer: Reviewer }) {
  return (
    <div>
      {reviewer.href ? (
        <Link
          href={reviewer.href}
          className="font-sora text-2xl leading-8 font-semibold text-neutral-900 hover:underline"
        >
          {reviewer.name}
        </Link>
      ) : (
        <p className="font-sora text-2xl leading-8 font-semibold text-neutral-900">
          {reviewer.name}
        </p>
      )}
      <Paragraph>{reviewer.role}</Paragraph>
    </div>
  );
}

/**
 * "Checked by people who know the test" — the two reviewer cards from Figma node 4147:8464.
 * Filled from the real published roster (GET /experts, then each profile for its intro) when there
 * is one; otherwise it falls back to DESIGN_REVIEWERS so the section still renders as designed.
 */
export default function ExpertsSection() {
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

  const reviewers =
    profiles.length > 0 ? profiles.map(toReviewer) : DESIGN_REVIEWERS;
  const [lead, second] = reviewers;

  return (
    <section className="bg-background2 px-5 py-15 lg:py-30">
      <div className="mx-auto flex max-w-container flex-col items-center gap-15">
        <Heading as="h2" className="text-center">
          Checked by people who know the test
        </Heading>

        <div className="grid w-full grid-cols-1 items-stretch gap-5 lg:grid-cols-[minmax(0,785fr)_minmax(0,555fr)]">
          {/* Lead reviewer — photo beside the write-up */}
          <article className="flex flex-col gap-8 rounded-[32px] border border-background2 bg-white p-8 shadow-[0px_4px_24px_0px_rgba(157,175,181,0.25)] sm:flex-row">
            <ReviewerPhoto
              reviewer={lead}
              className="w-full shrink-0 self-stretch rounded-3xl max-sm:aspect-square sm:w-[46%]"
            />
            <div className="flex flex-1 flex-col justify-center gap-6">
              <div className="space-y-4">
                {lead.quote.map((block, i) => (
                  <Paragraph key={i}>{block}</Paragraph>
                ))}
              </div>
              <ReviewerName reviewer={lead} />
            </div>
          </article>

          {/* Second reviewer — photo above a short pull-quote */}
          {second && (
            <article className="flex flex-col gap-8 rounded-[32px] border border-background2 bg-white p-8 shadow-[0px_4px_24px_0px_rgba(157,175,181,0.25)]">
              <ReviewerPhoto
                reviewer={second}
                className="aspect-[490/296] w-full rounded-3xl"
              />
              <div className="flex flex-1 flex-col justify-between gap-6">
                <Paragraph>{second.quote[0]}</Paragraph>
                <ReviewerName reviewer={second} />
              </div>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
