"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  PaginatedResponse,
  PublicVideo,
  VideoShowResponse,
} from "@driving-test-app/shared";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import Subheading from "@/components/ui/Subheading";
import StepCard from "@/components/state/StepCard";
import TestSteps from "@/components/state/TestSteps";
import { useHasProgressSidebar } from "@/components/state/StateHubLayout";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import PremiumDialog from "@/components/billing/PremiumDialog";
import { api } from "@/lib/api";
import { stateAbbreviations } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

// Matches the grouping/ordering driving-tests.org itself uses for this content — real section
// names as they come back from the API (Video::section, set at import time from the crawl's own
// `section` field). An unrecognized section still renders, just after these, alphabetically.
const SECTION_ORDER = [
  "Defensive Driving Hazard Simulators",
  "Learn to Drive Videos",
];

const SECTION_BLURBS: Record<string, string> = {
  "Defensive Driving Hazard Simulators":
    "Spot and react to real hazards in realistic driving footage — the closest thing to the actual road test.",
  "Learn to Drive Videos":
    "Short instructional videos covering the specific maneuvers examiners check for.",
};

function formatDuration(seconds: number | null): string | undefined {
  if (!seconds) return undefined;
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

// Source titles carry their own trailing "1:19 min" duration (e.g. "School Bus Stop Rules: When
// to Stop and When You Can Pass 1:19 min") — redundant with the duration StepCard already renders
// as its own line below, so it's stripped for display rather than shown twice.
function stripTrailingDuration(title: string): string {
  return title.replace(/\s+\d{1,3}:\d{2}\s*min\.?\s*$/i, "").trim();
}

/** Videos mapped to TestSteps' generic step shape — only what the connector-track layout itself
 * needs (none of it renders here; `renderStep` swaps in the real VideoStepCard per slot). */
function videoSteps(videos: PublicVideo[]) {
  return videos.map((video) => ({
    title: stripTrailingDuration(video.title),
    image: video.thumbnail_url ?? undefined,
    type: video.is_premium ? ("premium" as const) : ("free" as const),
    locked: video.locked,
    duration: formatDuration(video.duration_seconds),
  }));
}

function groupBy<T>(
  items: T[],
  keyOf: (item: T) => string | null,
  fallbackKey: string,
): [string | null, T[]][] {
  const groups = new Map<string | null, T[]>();
  for (const item of items) {
    const key = keyOf(item) ?? (fallbackKey === "" ? null : fallbackKey);
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }
  return [...groups.entries()];
}

function groupBySection(videos: PublicVideo[]): [string, PublicVideo[]][] {
  const groups = groupBy(videos, (v) => v.section, "More videos") as [
    string,
    PublicVideo[],
  ][];

  return groups.sort(([a], [b]) => {
    const rankA = SECTION_ORDER.indexOf(a);
    const rankB = SECTION_ORDER.indexOf(b);
    if (rankA === -1 && rankB === -1) return a.localeCompare(b);
    if (rankA === -1) return 1;
    if (rankB === -1) return -1;
    return rankA - rankB;
  });
}

/**
 * Same visual card as the "Simulators"/quiz steps in the phase ladder (StepCard) — thumbnail,
 * Free/Premium badge, title, duration — just driven by a Video instead of a Quiz. A video that
 * carries the interactive hazard-perception layer (`has_simulator`) links to the full-screen
 * player route; every other video opens the plain watch dialog via `onOpen`.
 */
function VideoStepCard({
  video,
  loading,
  onOpen,
}: {
  video: PublicVideo;
  loading: boolean;
  onOpen: (video: PublicVideo) => void;
}) {
  const card = (
    <StepCard
      step={{
        title: stripTrailingDuration(video.title),
        image: video.thumbnail_url ?? undefined,
        type: video.is_premium ? "premium" : "free",
        locked: video.locked,
        duration: formatDuration(video.duration_seconds),
      }}
    />
  );

  if (video.has_simulator && video.simulator_slug) {
    return (
      <Link
        href={`/hazard-simulator/${video.simulator_slug}`}
        className="flex flex-col h-full"
      >
        {card}
      </Link>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={loading}
      onClick={() => !loading && onOpen(video)}
      onKeyDown={(e) => {
        if (!loading && (e.key === "Enter" || e.key === " ")) onOpen(video);
      }}
      className={`flex flex-col h-full ${loading ? "pointer-events-none opacity-60" : ""}`}
    >
      {card}
    </div>
  );
}

/**
 * Real instructional/hazard-simulator videos for the current state/vehicle, scoped to the Driving
 * Test track — sourced from GET /videos?...&test_track=driving_test, grouped into the same
 * section/subsection structure the source data itself carries (e.g. "Defensive Driving Hazard
 * Simulators" vs "Learn to Drive Videos", each optionally split into named subsections like
 * "Common Mistakes to Avoid"), matching how driving-tests.org itself organizes this content. For
 * motorcycle in states where only hazard-perception simulators exist (no written question bank),
 * this is the only real practice content on the page, so it renders nothing if there's nothing to
 * show rather than a placeholder.
 */
export default function DrivingVideosSection() {
  const { selectedState, selectedVehicle } = useWebLayout();
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<VideoShowResponse | null>(
    null,
  );
  const [lockedVideo, setLockedVideo] = useState<PublicVideo | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const hasSidebar = useHasProgressSidebar();

  const stateCode = stateAbbreviations[selectedState];
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";

  useEffect(() => {
    if (!stateCode) return;
    let cancelled = false;

    api
      .get<PaginatedResponse<PublicVideo>>(
        `/videos?state=${stateCode}&vehicle_type=${vehicleType}&test_track=driving_test&per_page=100`,
      )
      .then((res) => {
        if (!cancelled) setVideos(res.data);
      })
      .catch(() => {
        if (!cancelled) setVideos([]);
      });

    return () => {
      cancelled = true;
    };
  }, [stateCode, vehicleType]);

  function openVideo(video: PublicVideo) {
    if (video.locked) {
      setLockedVideo(video);
      return;
    }

    setLoadingId(video.id);
    api
      .get<VideoShowResponse>(`/videos/${video.id}`)
      .then((res) => {
        if (res.url) setActiveVideo(res);
      })
      .finally(() => setLoadingId(null));
  }

  if (videos.length === 0) return null;

  const sections = groupBySection(videos);

  return (
    <section className="px-5 pb-15 lg:pb-30 bg-background2">
      <div className="mx-auto max-w-container space-y-12">
        <div className="max-w-170 mx-auto text-center space-y-4">
          <Subheading text="Behind the Wheel" align="center" />
          <Heading as="h2">Real driving videos & hazard simulators</Heading>
          <Paragraph>
            Instructional videos and hazard-perception simulators for{" "}
            {selectedState}, sourced from real driving test prep content.
          </Paragraph>
        </div>

        {sections.map(([section, sectionVideos], sectionIndex) => {
          // Most sections today are flat (no subsection on any video) — group by subsection only
          // when at least one video in this section actually carries one, so the common case
          // doesn't grow an extra heading level for nothing.
          const hasSubsections = sectionVideos.some((v) => v.subsection);
          const subgroups = hasSubsections
            ? groupBy(sectionVideos, (v) => v.subsection, "")
            : null;
          // These aren't real phase-ladder phases (no progression/locking between them), but they
          // reuse the exact same numbered-circle look — numbering restarts at 1 here rather than
          // continuing the ladder above, since this is its own independent list of sections.
          const isActive = sectionIndex === 0;

          return (
            <div key={section} className="space-y-10">
              <div className="flex gap-4 max-w-3xl">
                <div className="relative">
                  {sectionIndex > 0 && (
                    // No completion tracking for these (unlike real phase-ladder phases), so this
                    // never fills blue — stays the same "not yet reached" white as the connector
                    // trailing out of the previous section's last row, which it has to match at the
                    // seam or the two segments read as a color glitch instead of one continuous pipe.
                    <div className="md:w-18 w-8.5 ms-auto md:-me-4.5 md:border-l-14 border-l-8 md:border-t-14 md:rounded-tl-[28px] h-12 -mt-11.75 border-white dark:border-neutral-700" />
                  )}
                  <Heading
                    as="h3"
                    size="xs"
                    className={`relative overflow-hidden rounded-full flex items-center justify-center md:min-w-25 md:min-h-25 min-w-15 min-h-15 md:border-14 border-6 ${isActive ? "border-blue-100 text-white" : "border-background3 bg-white dark:bg-neutral-800"}`}
                  >
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-linear-to-r from-blue-600 to-blue-500"
                      />
                    )}
                    <span className="relative">{sectionIndex + 1}</span>
                  </Heading>
                  <div
                    className={`md:w-18 w-8.5 ms-auto md:-me-4.5 md:border-l-14 border-l-8 md:border-b-14 border-b-8 rounded-bl-[28px] h-[calc(100%+14px)] ${isActive ? "border-blue-500" : "border-white dark:border-neutral-700"}`}
                  />
                </div>

                <div className="max-w-3xl space-y-2">
                  <Paragraph color="primary" className="font-semibold">
                    {sectionVideos.length}{" "}
                    {sectionVideos.length === 1 ? "video" : "videos"}
                  </Paragraph>
                  <Heading as="h2">{section}</Heading>
                  {SECTION_BLURBS[section] && (
                    <Paragraph color="muted" className="pt-1">
                      {SECTION_BLURBS[section]}
                    </Paragraph>
                  )}
                </div>
              </div>

              {subgroups ? (
                <div className="space-y-8">
                  {subgroups.map(([subsection, subVideos], subIndex) => (
                    <div key={subsection ?? "__none"} className="space-y-4">
                      {subsection && (
                        <Paragraph className="font-medium" color="dark">
                          {subsection}
                        </Paragraph>
                      )}
                      <TestSteps
                        steps={videoSteps(subVideos)}
                        columns={hasSidebar ? 3 : 4}
                        leadingConnector={subIndex === 0}
                        nextConnector={
                          subIndex === subgroups.length - 1 &&
                          sectionIndex < sections.length - 1
                        }
                        renderStep={(_, index) => (
                          <VideoStepCard
                            video={subVideos[index]}
                            loading={loadingId === subVideos[index].id}
                            onOpen={openVideo}
                          />
                        )}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <TestSteps
                  steps={videoSteps(sectionVideos)}
                  columns={hasSidebar ? 3 : 4}
                  nextConnector={sectionIndex < sections.length - 1}
                  renderStep={(_, index) => (
                    <VideoStepCard
                      video={sectionVideos[index]}
                      loading={loadingId === sectionVideos[index].id}
                      onOpen={openVideo}
                    />
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <Dialog
        open={!!activeVideo}
        onOpenChange={(open) => !open && setActiveVideo(null)}
      >
        <DialogContent className="max-w-3xl! p-2">
          {activeVideo?.url && (
            <iframe
              src={activeVideo.url}
              title={activeVideo.video.title}
              className="aspect-video w-full rounded-lg"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          )}
        </DialogContent>
      </Dialog>

      <PremiumDialog
        open={!!lockedVideo}
        onOpenChange={(open) => !open && setLockedVideo(null)}
        title="Premium Video"
        description="This video is part of our premium library. Upgrade to unlock every instructional video and hazard simulator."
      />
    </section>
  );
}
