"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PaginatedResponse, PublicCheatSheet } from "@driving-test-app/shared";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { api } from "@/lib/api";
import { stateAbbreviations } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

/** Bundled stand-in for a cheat sheet with no published cover (or one that fails to load). */
const FALLBACK_COVER = "/signature-license.png";

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

/**
 * The three "rules unique to this state" cards from Figma, filled from the state's own cheat
 * sheets — the only per-state rule content the API actually publishes. Hidden entirely when a
 * state has none, rather than showing empty cards.
 */
export default function StateRulesSection() {
  const { selectedState, selectedVehicle } = useWebLayout();
  const stateCode = stateAbbreviations[selectedState] ?? "";
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";
  const [sheets, setSheets] = useState<PublicCheatSheet[]>([]);

  useEffect(() => {
    if (!stateCode) return;
    let cancelled = false;

    api
      .get<PaginatedResponse<PublicCheatSheet>>(`/cheat-sheets?state=${stateCode}&vehicle_type=${vehicleType}`)
      .then((res) => {
        if (!cancelled) setSheets(res.data.slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setSheets([]);
      });

    return () => {
      cancelled = true;
    };
  }, [stateCode, vehicleType]);

  if (sheets.length === 0) return null;

  return (
    <section className="px-5 py-15 lg:py-30">
      <div className="mx-auto flex max-w-container flex-col gap-4">
        <div className="space-y-4">
          <Heading as="h2" className="mx-auto max-w-166.5 text-center">
            {selectedState} specific rules you must know
          </Heading>
          <Paragraph size="xl" className="mx-auto max-w-149 text-center">
            Rules that are unique to {selectedState} or differ from most other states — the ones out-of-state study
            guides miss.
          </Paragraph>
        </div>

        <div className="grid grid-cols-1 gap-6 pt-8 md:grid-cols-2 lg:grid-cols-3">
          {sheets.map((sheet) => (
            <Link
              key={sheet.id}
              href={`/cheat-sheets/${sheet.id}`}
              className="flex flex-col rounded-3xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-800 px-2 pt-2 shadow-[0px_20px_40px_-10px_rgba(11,11,13,0.1)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sheet.cover_image_url ?? FALLBACK_COVER}
                alt=""
                className="h-49.25 w-full rounded-xl object-cover"
                onError={(e) => {
                  // A published cover can point at media this environment doesn't have; swap in
                  // the bundled plate rather than leaving a broken frame in the card.
                  const img = e.currentTarget;
                  if (img.src.endsWith(FALLBACK_COVER)) return;
                  img.src = FALLBACK_COVER;
                }}
              />
              <div className="flex flex-col gap-2.5 px-4 pt-4 pb-6">
                <h3 className="font-sora text-2xl leading-8 font-semibold text-neutral-900 dark:text-neutral-100">
                  {sheet.title}
                </h3>
                <Paragraph>{sheet.summary}</Paragraph>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
