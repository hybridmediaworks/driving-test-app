"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { PublicVideo, VideoShowResponse } from "@driving-test-app/shared";
import { Star } from "lucide-react";
import { api } from "@/lib/api";
import { useStateVideos } from "@/lib/useStateVideos";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { useWebLayout } from "@/lib/web-layout-context";

/**
 * Verified learner reviews. Portraits and avatars are the exact assets from the Figma frame (node
 * 4313:12563); the quotes and names are the real testimonials the home page's SuccessStories
 * section already carries, since Figma's own copy there is lorem placeholder and there is no
 * reviews endpoint to read from.
 */
const AVATAR_A = "/test-slug/review-avatar-1.webp";
const AVATAR_B = "/test-slug/review-avatar-2.webp";

const REVIEWS = [
  {
    name: "Amir Khan",
    role: "Passed first try",
    avatar: AVATAR_A,
    quote:
      "Best money I never spent — the free tests alone got me my license. Highly recommend to any new driver.",
  },
  {
    name: "Sarah Whitfield",
    role: "Passed first try",
    avatar: AVATAR_B,
    quote:
      "Passed my written test on the first try. The practice questions were almost identical to the real DMV exam — I walked in completely calm, and the explanations on every wrong answer finally made the rules stick.",
  },
  {
    name: "Ahmed Saimoon",
    role: "Passed first try",
    avatar: AVATAR_A,
    quote:
      "I studied on my commute with voice mode and aced the road-signs section — exactly the prep I needed. The mock exams feel exactly like the real thing, so by test day nothing surprised me at all.",
  },
  {
    name: "Maria Lopez",
    role: "Passed on retake",
    avatar: AVATAR_B,
    quote:
      "Failed twice with the manual. Two weeks on DriveLane and I finally passed.",
  },
];

const CARD =
  "flex flex-col rounded-2xl border border-blue-100 dark:border-white/10 bg-white dark:bg-neutral-800 drop-shadow-[0px_4px_12px_rgba(157,175,181,0.25)]";

function Stars() {
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="size-3.5 fill-yellow-500 text-yellow-500"
          strokeWidth={0}
        />
      ))}
    </div>
  );
}

/** The video id out of a YouTube embed URL, so a poster can be pulled straight from YouTube. */
function youtubeId(url: string | null): string | null {
  const match = url?.match(/\/embed\/([\w-]+)/);
  return match ? match[1] : null;
}

/**
 * Everything the hover-to-play cards need: the clip's URL resolved up front (it also gives us a
 * poster from YouTube, since the stored thumbnails are served from app storage and aren't in
 * every environment), and play/pause driven through the iframe API's postMessage commands —
 * these are YouTube embeds, so there's no media element of our own to call play() on.
 *
 * The player is only mounted once the pointer first arrives; loading six of them up front would
 * be a lot of network for a strip most visitors scroll past.
 */
function useHoverVideo(video: PublicVideo | undefined) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    if (!video || video.locked) return;
    let cancelled = false;

    api
      .get<VideoShowResponse>(`/videos/${video.id}`)
      .then((res) => {
        if (!cancelled) setUrl(res.url);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [video]);

  useEffect(() => {
    if (!played) return;
    frameRef.current?.contentWindow?.postMessage(
      JSON.stringify({
        event: "command",
        func: hovered ? "playVideo" : "pauseVideo",
        args: [],
      }),
      "*",
    );
  }, [hovered, played]);

  const id = youtubeId(url);

  return {
    frameRef,
    playing: !!url && played,
    showing: played && hovered,
    poster: id
      ? `https://img.youtube.com/vi/${id}/hqdefault.jpg`
      : (video?.thumbnail_url ?? null),
    // `autoplay` covers the first hover, where the player isn't ready for a command yet;
    // `enablejsapi` is what lets play/pause reach it afterwards. Muted throughout, so a hover
    // never blares audio at someone scrolling past.
    src: url
      ? `${url}?enablejsapi=1&autoplay=1&mute=1&controls=0&rel=0&playsinline=1&loop=1&playlist=${id}`
      : null,
    handlers: {
      onMouseEnter: () => {
        setHovered(true);
        if (url) setPlayed(true);
      },
      onMouseLeave: () => setHovered(false),
    },
    // The pointer can leave again before the player finishes loading — catch that here, otherwise
    // it would autoplay to nobody.
    onLoad: () => {
      frameRef.current?.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: hovered ? "playVideo" : "pauseVideo",
          args: [],
        }),
        "*",
      );
    },
  };
}

function ReviewCard({
  review,
  video,
}: {
  review: (typeof REVIEWS)[number];
  video?: PublicVideo;
}) {
  const { frameRef, ...clip } = useHoverVideo(video);

  return (
    <article {...clip.handlers} className={`${CARD} relative overflow-hidden`}>
      <div className="flex items-start gap-3 px-5 pt-5">
        <Image
          src={review.avatar}
          alt=""
          width={60}
          height={60}
          className="size-15 shrink-0 rounded-full object-cover"
        />
        <div className="flex flex-col gap-2">
          <p className="leading-tight">
            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {review.name}
            </span>
            <br />
            <span className="text-sm text-neutral-700 dark:text-neutral-400">
              {review.role}
            </span>
          </p>
          <Stars />
        </div>
      </div>
      <div className="p-5">
        <Paragraph>{review.quote}</Paragraph>
      </div>

      {/* The written review is what's on the card; hovering plays their clip over the top of it
          and leaving pauses it and fades the words back in. */}
      {clip.src && (
        <div
          className={`absolute inset-0 bg-neutral-900 transition-opacity duration-300 ${
            clip.showing ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {clip.playing && (
            <iframe
              ref={frameRef}
              src={clip.src}
              title={video?.title ?? ""}
              allow="autoplay; picture-in-picture"
              className="absolute top-1/2 left-1/2 aspect-video h-full w-auto min-w-full -translate-x-1/2 -translate-y-1/2"
              onLoad={clip.onLoad}
            />
          )}
        </div>
      )}
    </article>
  );
}

/** One of the two tall cards either side of the reviews — the portraits imported from Figma. */
function PortraitCard({ src }: { src: string }) {
  return (
    <div className="relative h-100 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0px_4px_24px_0px_rgba(157,175,181,0.25)] lg:h-150 dark:border-white/10 dark:bg-neutral-800">
      <Image src={src} alt="" fill sizes="325px" className="object-cover" />
    </div>
  );
}

export default function ReviewsSection() {
  const { selectedState } = useWebLayout();
  // One clip per review card; the tall portraits either side stay as the imported stills.
  const videos = useStateVideos(4);

  return (
    <section className="bg-background2 px-5 py-15 lg:py-30">
      <div className="mx-auto flex max-w-container flex-col items-center gap-15">
        <div className="flex max-w-205 flex-col items-center gap-6 text-center">
          <Heading as="h2" className="text-center">
            Real {selectedState} drivers, real results
          </Heading>
          <Paragraph size="xl" className="text-center">
            Verified student reviews, shared with permission.
          </Paragraph>
        </div>

        <div className="grid w-full items-start gap-5 lg:grid-cols-[minmax(0,325fr)_minmax(0,670fr)_minmax(0,325fr)]">
          <PortraitCard src="/test-slug/review-portrait-left-v2.webp" />

          {/* Two staggered rows — a narrow card beside a wide one, then mirrored, exactly the
              off-grid rhythm in Figma. The pair is pinned to the same 600px height as the
              portraits either side, so all three columns start and finish on the same line
              instead of the middle stack floating between them. */}
          <div className="grid gap-5 lg:h-150 lg:grid-rows-2">
            <div className="grid gap-5 sm:grid-cols-[minmax(0,238fr)_minmax(0,413fr)]">
              <ReviewCard review={REVIEWS[0]} video={videos[0]} />
              <ReviewCard review={REVIEWS[1]} video={videos[1]} />
            </div>
            <div className="grid gap-5 sm:grid-cols-[minmax(0,413fr)_minmax(0,238fr)]">
              <ReviewCard review={REVIEWS[2]} video={videos[2]} />
              <ReviewCard review={REVIEWS[3]} video={videos[3]} />
            </div>
          </div>

          <PortraitCard src="/test-slug/review-portrait-right-v2.webp" />
        </div>
      </div>
    </section>
  );
}
