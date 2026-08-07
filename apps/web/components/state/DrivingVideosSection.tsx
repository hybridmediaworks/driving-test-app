"use client";

import { useEffect, useState } from "react";
import type { PaginatedResponse, PublicVideo, VideoShowResponse } from "@driving-test-app/shared";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import Subheading from "@/components/ui/Subheading";
import StepCard from "@/components/state/StepCard";
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
const SECTION_ORDER = ["Defensive Driving Hazard Simulators", "Learn to Drive Videos"];

const SECTION_BLURBS: Record<string, string> = {
  "Defensive Driving Hazard Simulators":
    "Spot and react to real hazards in realistic driving footage — the closest thing to the actual road test.",
  "Learn to Drive Videos": "Short instructional videos covering the specific maneuvers examiners check for.",
};

function formatDuration(seconds: number | null): string | undefined {
  if (!seconds) return undefined;
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function groupBy<T>(items: T[], keyOf: (item: T) => string | null, fallbackKey: string): [string | null, T[]][] {
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
  const groups = groupBy(videos, (v) => v.section, "More videos") as [string, PublicVideo[]][];

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
 * Free/Premium badge, title, duration — just driven by a Video instead of a Quiz, and clicking
 * opens a watch dialog instead of navigating to a quiz page (no `state`/`slug` passed to StepCard,
 * so it renders its bare content div with no Link wrapper; this wrapper supplies the click).
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
  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={loading}
      onClick={() => !loading && onOpen(video)}
      onKeyDown={(e) => {
        if (!loading && (e.key === "Enter" || e.key === " ")) onOpen(video);
      }}
      className={loading ? "pointer-events-none opacity-60" : undefined}
    >
      <StepCard
        step={{
          title: video.title,
          image: video.thumbnail_url ?? undefined,
          type: video.is_premium ? "premium" : "free",
          locked: video.locked,
          duration: formatDuration(video.duration_seconds),
        }}
      />
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
  const [activeVideo, setActiveVideo] = useState<VideoShowResponse | null>(null);
  const [lockedVideo, setLockedVideo] = useState<PublicVideo | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

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
    <section className="px-5 pb-15 lg:pb-30">
      <div className="mx-auto max-w-container space-y-12">
        <div className="max-w-170 space-y-4">
          <Subheading text="Behind the Wheel" />
          <Heading as="h2">Real driving videos & hazard simulators</Heading>
          <Paragraph>
            Instructional videos and hazard-perception simulators for {selectedState}, sourced from real driving
            test prep content.
          </Paragraph>
        </div>

        {sections.map(([section, sectionVideos]) => {
          // Most sections today are flat (no subsection on any video) — group by subsection only
          // when at least one video in this section actually carries one, so the common case
          // doesn't grow an extra heading level for nothing.
          const hasSubsections = sectionVideos.some((v) => v.subsection);
          const subgroups = hasSubsections ? groupBy(sectionVideos, (v) => v.subsection, "") : null;

          return (
            <div key={section} className="space-y-5">
              <div className="space-y-1">
                <Paragraph size="lg" className="font-semibold" color="dark">
                  {section} <span className="font-normal text-neutral-400">({sectionVideos.length})</span>
                </Paragraph>
                {SECTION_BLURBS[section] && (
                  <Paragraph size="sm" color="muted">
                    {SECTION_BLURBS[section]}
                  </Paragraph>
                )}
              </div>

              {subgroups ? (
                <div className="space-y-8">
                  {subgroups.map(([subsection, subVideos]) => (
                    <div key={subsection ?? "__none"} className="space-y-4">
                      {subsection && (
                        <Paragraph className="font-medium" color="dark">
                          {subsection}
                        </Paragraph>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {subVideos.map((video) => (
                          <VideoStepCard key={video.id} video={video} loading={loadingId === video.id} onOpen={openVideo} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {sectionVideos.map((video) => (
                    <VideoStepCard key={video.id} video={video} loading={loadingId === video.id} onOpen={openVideo} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={!!activeVideo} onOpenChange={(open) => !open && setActiveVideo(null)}>
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
