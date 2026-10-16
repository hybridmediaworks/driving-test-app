"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function PdfIllustration() {
  return (
    <div className="flex aspect-[540/378] w-full items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/15">
      <div className="relative aspect-[6/7] h-[63%] rounded-lg bg-white p-3 shadow-[0_14px_28px_-10px_rgba(37,99,235,0.45)]">
        <span className="block h-1.5 w-3/5 rounded-full bg-blue-600" />
        <span className="mt-2.5 block h-1 w-full rounded-full bg-blue-100" />
        <span className="mt-1.5 block h-1 w-full rounded-full bg-blue-100" />
        <span className="mt-1.5 block h-1 w-3/4 rounded-full bg-blue-100" />
        <span className="absolute right-2 bottom-3 rounded bg-red-600 px-1.5 py-0.5 text-[9px] leading-none font-bold text-white">
          PDF
        </span>
      </div>
    </div>
  );
}

export default function HandbookSection() {
  const { selectedState, selectedVehicle } = useWebLayout();
  const [handbook, setHandbook] = useState<Handbook | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

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

  if (!handbook) return null;

  const cards: {
    title: string;
    body: string;
    media: ReactNode;
    cta: string;
    href?: string;
    onClick?: () => void;
  }[] = [
    {
      title: "Read online",
      body: "Full text, searchable",
      media: (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/state-hub/handbook-read.png" alt="" className="aspect-[540/378] w-full rounded-xl object-cover" />
      ),
      href: `/handbook/${handbook.id}`,
      cta: "Open handbook",
    },
    {
      title: "Listen",
      body: "The real text, read aloud",
      media: (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/state-hub/handbook-listen.png" alt="" className="aspect-[540/378] w-full rounded-xl object-cover" />
      ),
      href: `/handbook/${handbook.id}?listen=1`,
      cta: "Start listening",
    },
    ...(handbook.pdf_url
      ? [
          {
            title: "Download",
            body: "The full handbook, offline",
            media: <PdfIllustration />,
            onClick: handleDownload,
            cta: downloading ? "Downloading…" : "Download PDF",
          },
        ]
      : []),
  ];

  const cardClass =
    "group flex flex-col rounded-2xl border border-border bg-white p-2 pb-5 text-left shadow-xs transition-transform duration-300 hover:-translate-y-1 dark:bg-neutral-800";

  return (
    <section id="handbook" className="scroll-mt-6 px-5 py-15 lg:py-28">
      <div className="mx-auto grid max-w-container grid-cols-1 items-center gap-10 lg:grid-cols-[325px_minmax(0,1fr)] lg:gap-14">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">
            Driver&rsquo;s handbook
          </p>
          <Heading as="h2" size="md" weight="bold" className="mt-3">
            {`Explore the ${selectedState} Driver’s Handbook`}
          </Heading>
          <Paragraph color="muted" className="mt-5">
            Jump straight to the chapters that matter most. Each guide is condensed and paired with practice
            questions.
          </Paragraph>
          <Link
            href={`/handbook/${handbook.id}`}
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            Open handbook <span aria-hidden>&rarr;</span>
          </Link>
        </div>

        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {cards.map((card) => {
              const inner = (
                <>
                  {card.media}
                  <div className="px-2 pt-4">
                    <h3 className="font-sora text-lg font-bold text-neutral-900 dark:text-neutral-100">{card.title}</h3>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{card.body}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:underline dark:text-blue-400">
                      {card.cta} <span aria-hidden>&rarr;</span>
                    </span>
                  </div>
                </>
              );

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
                  className={`${cardClass} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {inner}
                </button>
              );
            })}
          </div>

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
