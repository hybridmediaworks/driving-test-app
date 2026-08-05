"use client";

import { ChevronRight, NotebookText } from "lucide-react";
import { useEffect, useState } from "react";
import type { PaginatedResponse, PublicCheatSheet } from "@driving-test-app/shared";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";
import { api } from "@/lib/api";

/**
 * Replaces the old HandbookBanner's fabricated "PDF (112 pages) / MP3 (2h 04m) / 13 MB" stats and
 * dead "Open Handbook" button with a real count pulled from the API and a working link — no
 * audio/listen feature exists (that would be a separate Phase 3 asset type), so it isn't promised.
 */
export default function CheatSheetsBanner({
  stateCode,
  vehicleType,
}: {
  stateCode?: string;
  vehicleType?: string;
} = {}) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ per_page: "1" });
    if (stateCode) params.set("state", stateCode);
    if (vehicleType) params.set("vehicle_type", vehicleType.toLowerCase());

    api.get<PaginatedResponse<PublicCheatSheet>>(`/cheat-sheets?${params.toString()}`).then((res) => setCount(res.meta.total));
  }, [stateCode, vehicleType]);

  return (
    <div className="relative flex items-center justify-between overflow-hidden rounded-2xl bg-blue-50 ps-5 pr-15">
      <div className="space-y-3 py-5">
        <Paragraph className="max-w-md" size="sm">
          Condensed, high-yield study guides — read online or download as a PDF to study offline.
        </Paragraph>

        <div className="flex items-center gap-2.5">
          <div className="flex size-11 items-center justify-center rounded-full border-2 border-blue-primary text-blue-primary">
            <NotebookText className="size-5" />
          </div>
          <div className="space-y-0">
            <p className="text-sm font-semibold">
              {count === null ? "Cheat sheets" : `${count} cheat sheet${count === 1 ? "" : "s"}`}
            </p>
            <span className="text-sm text-grey">Right-of-way, road signs, and more</span>
          </div>
        </div>

        <Button variant="ghost" className="p-0!" size="sm" href="/cheat-sheets">
          Browse cheat sheets <ChevronRight className="w-4" />
        </Button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/Oregon.avif" className="max-w-35.5 shrink-0 object-cover pt-5" alt="" />
    </div>
  );
}
