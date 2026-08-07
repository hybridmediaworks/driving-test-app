"use client";

import { useEffect, useState } from "react";
import type { Handbook, PaginatedResponse } from "@driving-test-app/shared";
import { ArrowDownToLine, BookOpen } from "lucide-react";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";
import { api } from "@/lib/api";
import { stateAbbreviations } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

/**
 * Real replacement for the old HandBookSection.tsx (fake "3h 12m audio" / "Ask the handbook AI"
 * card with a dead "Open handbook" button, never wired to real data). Sourced from
 * GET /handbooks?state=&vehicle_type= — renders nothing at all if no handbook has been imported
 * yet for this state/vehicle, rather than showing a fake reader experience.
 */
export default function HandbookCard() {
  const { selectedState, selectedVehicle } = useWebLayout();
  const [handbook, setHandbook] = useState<Handbook | null>(null);

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

  if (!handbook) return null;

  return (
    <div className="mx-auto max-w-container px-5">
      <div className="relative max-w-226 mx-auto p-6 bg-white rounded-2xl flex flex-col lg:flex-row justify-between items-center xl:gap-4 gap-6 border">
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
        <div className="flex-1 w-full grid md:grid-cols-2 grid-cols-1 gap-4">
          <div className="p-4 flex gap-4 bg-neutral-50 border rounded-lg">
            <BookOpen className="min-w-10.5 min-h-10.5 p-2.5 rounded-md border text-blue-700 " />
            <div>
              <Paragraph className="font-semibold" color="dark">
                Read online
              </Paragraph>
              <Paragraph color="dark" size="sm">
                Right here, on DriveLane
              </Paragraph>
            </div>
          </div>
          {handbook.pdf_url && (
            <div className="p-4 flex gap-4 bg-neutral-50 border rounded-lg">
              <ArrowDownToLine className="min-w-10.5 min-h-10.5 p-2.5 rounded-md border text-blue-700 " />
              <div>
                <Paragraph className="font-semibold" color="dark">
                  Download PDF
                </Paragraph>
                <Paragraph color="dark" size="sm">
                  Full handbook
                </Paragraph>
              </div>
            </div>
          )}
          <div className="pt-3.5 flex gap-3 md:col-span-2">
            <Button variant="outline" href={`/handbook/${handbook.id}`}>
              Read online
            </Button>
            {handbook.pdf_url && (
              <Button variant="outline" href={handbook.pdf_url}>
                Download PDF
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
