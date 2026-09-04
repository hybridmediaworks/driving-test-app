"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDownCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Volume2,
} from "lucide-react";
import type { Handbook, PaginatedResponse } from "@driving-test-app/shared";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { api, ApiError, downloadFile } from "@/lib/api";
import { stateAbbreviations } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

/** The real chapter index the API detects from the PDF's own pages (GET /handbooks/{id}/text). */
type DetectedChapter = { number: number; title: string; start_page: number };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * "Explore the {State} Driver's Handbook" — the copy column with real chapter chips beside a
 * horizontally scrolling card rail (Figma node 4147:8317). Replaces the handbook rung that used
 * to render inside the phase ladder, which the redesign pulls out into its own section here.
 *
 * Card subtitles state only what the app can actually back: no invented "3h 12m audio" / "4.2 MB"
 * figures.
 *
 * The chapter chips are the handbook's REAL chapters, from /handbooks/{id}/text — the `chapters`
 * on the handbook record itself are a crawl artifact (one row holding the source site's download-
 * page blurb), not the document's contents. That endpoint parses the PDF, so the first call for a
 * given PDF is slow; it's `Cache::rememberForever`d server-side by media id, and this only fires
 * once the section scrolls into view so a visitor who never reaches it never pays for it.
 */
export default function HandbookSection() {
  const { selectedState, selectedVehicle, selectedTestType } = useWebLayout();
  const [handbook, setHandbook] = useState<Handbook | null>(null);
  const [chapters, setChapters] = useState<DetectedChapter[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const stateCode = stateAbbreviations[selectedState];
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";

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

    return () => {
      cancelled = true;
    };
  }, [stateCode, vehicleType]);

  // Chapter chips: only fetched once this section is near the viewport, and only once per
  // handbook. Failures are silent — no chips is the same outcome as a PDF with no detectable
  // chapter convention, which the API reports as `chapters: null` by design.
  useEffect(() => {
    const node = sectionRef.current;
    const handbookId = handbook?.id;
    if (!node || !handbookId) return;

    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();

        api
          .get<{ chapters: DetectedChapter[] | null }>(
            `/handbooks/${handbookId}/text`,
          )
          .then((res) => {
            if (!cancelled) setChapters(res.chapters ?? []);
          })
          .catch(() => {});
      },
      { rootMargin: "400px" },
    );

    observer.observe(node);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [handbook?.id]);

  async function handleDownload() {
    if (!handbook || downloading) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadFile(
        `/handbooks/${handbook.id}/download`,
        `${slugify(handbook.title)}.pdf`,
      );
    } catch (err) {
      setDownloadError(
        err instanceof ApiError
          ? err.message
          : "Failed to download the PDF. Please try again.",
      );
    } finally {
      setDownloading(false);
    }
  }

  function scrollRail(direction: 1 | -1) {
    railRef.current?.scrollBy({ left: direction * 340, behavior: "smooth" });
  }

  // Which chevrons have somewhere to go. Recomputed on scroll and on resize, since how many cards
  // fit — and therefore whether the rail overflows at all — changes with the viewport.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const update = () => {
      const maxScroll = rail.scrollWidth - rail.clientWidth;
      setCanScrollPrev(rail.scrollLeft > 1);
      setCanScrollNext(rail.scrollLeft < maxScroll - 1);
    };

    update();
    rail.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(rail);

    return () => {
      rail.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [handbook?.id]);

  if (!handbook) return null;

  const quizzesHref = `/quizzes?state=${stateCode}&vehicle_type=${vehicleType}&test_track=${selectedTestType}`;

  const cards = [
    {
      icon: BookOpen,
      title: "Read online",
      body: "Full text, searchable",
      image: "/state-hub/handbook-read.png",
      href: `/handbook/${handbook.id}`,
      cta: "Open handbook",
    },
    {
      icon: Volume2,
      title: "Listen",
      body: "The real text, read aloud",
      image: "/state-hub/handbook-listen.png",
      href: `/handbook/${handbook.id}?listen=1`,
      cta: "Start listening",
    },
    ...(handbook.pdf_url
      ? [
          {
            icon: ArrowDownCircle,
            title: "Download PDF",
            body: "The full handbook, offline",
            image: "/state-hub/handbook-download.jpg",
            onClick: handleDownload,
            cta: downloading ? "Downloading…" : "Download PDF",
          },
        ]
      : []),
    {
      icon: MessageSquareText,
      title: "Practice questions",
      body: "Test what you just read",
      image: "/state-hub/handbook-ask.jpg",
      href: quizzesHref,
      cta: "Try a mock exam",
    },
  ];

  const chapterChips = chapters.slice(0, 6);

  return (
    <section ref={sectionRef} id="handbook" className="scroll-mt-6 px-5 py-15 lg:py-30">
      <div className="mx-auto grid max-w-container grid-cols-1 items-end gap-10 lg:grid-cols-[525px_minmax(0,1fr)] lg:gap-12">
        {/* Copy column */}
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <Heading as="h2">
                {`Explore the ${selectedState} Driver's Handbook`}
              </Heading>
              <Paragraph size="xl">
                Jump straight to the chapters that matter most. Each guide is
                condensed and paired with practice questions.
              </Paragraph>
            </div>

            {chapterChips.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {chapterChips.map((chapter) => (
                  <li
                    key={chapter.number}
                    className="rounded-2xl border border-background2 bg-white px-4 py-2 text-sm leading-5 text-neutral-700"
                  >
                    {chapter.title}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            href={`/handbook/${handbook.id}`}
            className="inline-flex items-center gap-1.5 text-base leading-6 font-bold text-blue-600 hover:underline"
          >
            Open handbook <span aria-hidden>&rarr;</span>
          </Link>
        </div>

        {/* Card rail */}
        <div className="relative min-w-0">
          <div
            ref={railRef}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {cards.map((card) => {
              const { icon: Icon } = card;
              const inner = (
                <>
                  <div className="min-h-0 flex-1 overflow-hidden rounded-3xl bg-background2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.image}
                      alt=""
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                      <span className="flex size-10.5 items-center justify-center rounded-lg border border-blue-50 bg-white text-blue-500">
                        <Icon className="size-5" />
                      </span>
                      <div className="space-y-2">
                        <h3 className="font-sora text-2xl leading-8 font-semibold text-neutral-900">
                          {card.title}
                        </h3>
                        <Paragraph>{card.body}</Paragraph>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-base leading-6 font-bold text-blue-600">
                      {card.cta} <span aria-hidden>&rarr;</span>
                    </span>
                  </div>
                </>
              );

              const cardClass =
                "flex h-[433px] w-[300px] shrink-0 snap-start flex-col gap-6 rounded-[32px] border border-background3 bg-white p-6 text-left shadow-[0px_4px_24px_0px_rgba(157,175,181,0.25)] transition-transform duration-300 hover:-translate-y-1 sm:w-[320px]";

              return card.href ? (
                <Link key={card.title} href={card.href} className={cardClass}>
                  {inner}
                </Link>
              ) : (
                <button
                  key={card.title}
                  type="button"
                  onClick={card.onClick}
                  disabled={downloading}
                  className={`${cardClass} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {inner}
                </button>
              );
            })}
          </div>

          {/* Rail controls — the design only draws the "next" chevron because it renders the rail
              at its start. Each one appears whenever there is actually something to scroll to in
              that direction, so the "prev" chevron shows up as soon as the rail moves off zero. */}
          <button
            type="button"
            onClick={() => scrollRail(-1)}
            aria-label="Previous handbook option"
            aria-hidden={!canScrollPrev}
            tabIndex={canScrollPrev ? 0 : -1}
            className={`absolute top-1/2 left-0 hidden size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600 shadow-[0px_4px_8px_0px_rgba(0,0,0,0.12)] transition-opacity duration-200 lg:flex ${
              canScrollPrev ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <ChevronLeft className="size-8" />
          </button>
          <button
            type="button"
            onClick={() => scrollRail(1)}
            aria-label="Next handbook option"
            aria-hidden={!canScrollNext}
            tabIndex={canScrollNext ? 0 : -1}
            className={`absolute top-1/2 right-0 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600 shadow-[0px_4px_8px_0px_rgba(0,0,0,0.12)] transition-opacity duration-200 lg:flex ${
              canScrollNext ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <ChevronRight className="size-8" />
          </button>

          {downloadError && (
            <Paragraph size="sm" className="text-destructive mt-3">
              {downloadError}
            </Paragraph>
          )}
        </div>
      </div>
    </section>
  );
}
