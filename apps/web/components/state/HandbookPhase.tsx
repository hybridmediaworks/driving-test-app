"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Handbook, PaginatedResponse } from "@driving-test-app/shared";
import { ArrowDownToLine, BookOpen, Headphones } from "lucide-react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { api, downloadFile, ApiError } from "@/lib/api";
import { stateAbbreviations } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * The handbook rung of the phase ladder. The reference shows "Explore <STATE> Driver's Handbook"
 * as the final numbered step, right after "The extra support" — the "Challenge Bank" step that sits
 * between them in the reference isn't modeled in our data, so it's intentionally skipped and the
 * handbook takes the next number in sequence. Closes with the "end of theory prep" milestone.
 * Renders the milestone alone (no numbered handbook) when no handbook exists for this
 * state/vehicle yet.
 */
export default function HandbookPhase({ phaseNumber }: { phaseNumber: number }) {
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
      .get<PaginatedResponse<Handbook>>(`/handbooks?state=${stateCode}&vehicle_type=${vehicleType}`)
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
      await downloadFile(`/handbooks/${handbook.id}/download`, `${slugify(handbook.title)}.pdf`);
    } catch (err) {
      setDownloadError(err instanceof ApiError ? err.message : "Failed to download the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      {handbook && (
        <div className="space-y-10">
          <div className="flex gap-4 max-w-3xl">
            <div className="relative">
              <div className="md:w-15 w-8.5 ms-auto md:border-l-14 border-l-8 md:border-t-14 md:rounded-tl-[28px] h-12 -mt-11.75 border-white" />
              <Heading
                as="h3"
                size="xs"
                className="relative overflow-hidden rounded-full flex items-center justify-center md:min-w-25 md:min-h-25 min-w-15 min-h-15 md:border-14 border-6 border-blue-100 text-white"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-linear-to-r from-blue-600 to-blue-500"
                />
                <span className="relative">{phaseNumber}</span>
              </Heading>
              <div className="md:w-15 w-8.5 ms-auto md:border-l-14 border-l-8 md:border-b-14 border-b-8 rounded-bl-[28px] h-full border-white" />
            </div>
            <div className="space-y-2">
              <Heading as="h2">Explore {stateCode} Driver&apos;s Handbook</Heading>
              <Paragraph color="muted" className="pt-1">
                Not your typical read — this interactive handbook is designed for engagement. Study
                anytime, anywhere: read, listen, or download for offline access.
              </Paragraph>
            </div>
          </div>

          <div className="relative p-6 bg-white rounded-2xl flex flex-col lg:flex-row justify-between items-center xl:gap-4 gap-6 border">
            <div className="min-h-40 lg:min-h-53 shadow-[0_4px_6px_-2px_rgba(0,0,0,0.03),0_12px_16px_-4px_rgba(0,0,0,0.08)] bg-[linear-gradient(157deg,#1E3A8A_0%,var(--color-blue-1000)_100%)] w-full max-w-55 rounded-lg overflow-hidden flex items-stretch">
              <div className="bg-black/25 min-w-2.5" />
              <div className="pt-6 ps-2.5 pb-5 flex flex-col justify-between gap-5">
                <div className="space-y-2">
                  <Paragraph size="sm" className="text-blue-200!">
                    {selectedState}
                  </Paragraph>
                  <Paragraph size="xl" className="font-sora font-semibold" color="white">
                    {handbook.title}
                  </Paragraph>
                </div>
                {handbook.total_words && (
                  <Paragraph size="xs" color="white">
                    {handbook.total_words.toLocaleString()} words
                  </Paragraph>
                )}
              </div>
            </div>
            <div className="flex-1 w-full grid md:grid-cols-3 grid-cols-1 gap-4">
              <Link
                href={`/handbook/${handbook.id}`}
                className="p-4 flex gap-4 bg-neutral-50 border rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <BookOpen className="min-w-10.5 min-h-10.5 p-2.5 rounded-md border text-blue-700 " />
                <div>
                  <Paragraph className="font-semibold" color="dark">
                    Read online
                  </Paragraph>
                  <Paragraph color="dark" size="sm">
                    Right here, on DriveLane
                  </Paragraph>
                </div>
              </Link>
              <Link
                href={`/handbook/${handbook.id}?listen=1`}
                className="p-4 flex gap-4 bg-neutral-50 border rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <Headphones className="min-w-10.5 min-h-10.5 p-2.5 rounded-md border text-blue-700 " />
                <div>
                  <Paragraph className="font-semibold" color="dark">
                    Listen to handbook
                  </Paragraph>
                  <Paragraph color="dark" size="sm">
                    The real text, read aloud
                  </Paragraph>
                </div>
              </Link>
              {handbook.pdf_url && (
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="p-4 flex gap-4 bg-neutral-50 border rounded-lg hover:bg-neutral-100 transition-colors text-left disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArrowDownToLine className="min-w-10.5 min-h-10.5 p-2.5 rounded-md border text-blue-700 " />
                  <div>
                    <Paragraph className="font-semibold" color="dark">
                      {downloading ? "Downloading…" : "Download PDF"}
                    </Paragraph>
                    <Paragraph color="dark" size="sm">
                      Full handbook
                    </Paragraph>
                  </div>
                </button>
              )}
              {downloadError && (
                <Paragraph size="sm" className="text-destructive md:col-span-3">
                  {downloadError}
                </Paragraph>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Connector from badge 6's left rail: down, curve right, then curve back down into the
          centred finish-line pill. A single SVG path keeps the corners seamless. */}
      <svg
        aria-hidden
        className="block h-[120px] w-full text-white"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M40 0 V44 Q40 60 56 60 H584 Q600 60 600 76 V120"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex flex-col items-center gap-4 -mt-2 pb-6 text-center lg:pb-14">
          <span className="rounded-full bg-purple-100 px-4 py-1.5 text-sm font-medium text-purple-700">
            End of theory exam preparation
          </span>
          <Heading as="h2">Pass official DMV written exam</Heading>
          <Paragraph color="muted" className="max-w-xl">
            Once you reach this point with an 80%{" "}
            <span className="font-semibold text-blue-700">passing probability</span>, you&apos;ll be
            ready to pass the official DMV written exam with ease and confidence.
          </Paragraph>
      </div>
    </div>
  );
}
