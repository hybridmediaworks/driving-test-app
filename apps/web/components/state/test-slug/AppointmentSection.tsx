"use client";

import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { useWebLayout } from "@/lib/web-layout-context";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { State } from "@driving-test-app/shared";
import { api } from "@/lib/api";
import { DMV_DIRECTORY_URL } from "@/lib/dmv";
import { stateAbbreviations } from "@/lib/usStates";

/**
 * Full-bleed booking prompt between the facts grid and the weak-topics breakdown — an aerial road
 * plate, darkened, with the state's own DMV site as the destination.
 */
export default function AppointmentSection() {
  const { selectedState } = useWebLayout();
  const stateCode = stateAbbreviations[selectedState] ?? "";
  const [stateInfo, setStateInfo] = useState<State | null>(null);

  useEffect(() => {
    if (!stateCode) return;
    let cancelled = false;

    api
      .get<{ data: State[] }>("/states")
      .then((res) => {
        if (!cancelled) setStateInfo(res.data.find((s) => s.code === stateCode) ?? null);
      })
      .catch(() => {
        if (!cancelled) setStateInfo(null);
      });

    return () => {
      cancelled = true;
    };
  }, [stateCode]);

  // The CTA is the whole point of this band, so it always renders: the state's own booking page
  // when it's been published, and USAGov's state DMV directory otherwise.
  const bookingUrl = stateInfo?.dmv_website_url ?? DMV_DIRECTORY_URL;
  const agencyName = stateInfo?.agency_name ?? "DMV";

  return (
    <section className="relative isolate flex items-center overflow-hidden px-5 py-25 lg:h-149 lg:py-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/test-slug/dmv-appointment-road.webp"
        alt=""
        className="absolute inset-0 -z-20 h-full w-full object-cover object-top"
      />
      <div className="absolute inset-0 -z-10 bg-black/50" />

      <div className="mx-auto flex w-full max-w-231 flex-col items-center gap-4 text-center">
        <Heading as="h2" className="text-neutral-100!">
          Schedule your {selectedState} {agencyName} appointment
        </Heading>
        <Paragraph size="xl" className="max-w-161.5 text-neutral-300!">
          Field offices release slots 90 days out. Book before you finish studying, not after.
        </Paragraph>
        <Button className="mt-2 px-12 to-blue-800!" href={bookingUrl}>
          Schedule your appointment now <ArrowRight />
        </Button>
      </div>
    </section>
  );
}
