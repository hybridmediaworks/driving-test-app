"use client";

import { ArrowUpRight, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import StateSelectModal from "@/components/home/StateSelectModal";
import { stateToSlug } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

/**
 * Fanned "deck" of driver portraits — exact Figma geometry (node 1659:7443). Every card uses
 * an EXPLICIT fixed px left/width/height taken 1:1 from Figma. Fixed px (no `aspect-ratio`
 * calc) makes the card's aspect identical in every browser, so `object-cover` never clips the
 * top/bottom of the face — card 6 matches the photo aspect exactly (full image), the rest crop
 * only the sides. Bottom-aligned → the arc; the left offsets reproduce Figma's spread + gaps.
 */
const DECK_W = 1513; // design width of the whole fanned deck
// `deck-*c.jpg` are the source portraits with the baked-in cream padding trimmed
// off (top/bottom), so `object-cover` fills the frame with the person edge-to-edge
// instead of showing an empty band. New filenames bust Next's immutable image cache.
const GALLERY_CARDS = [
  { src: "/hero/deck-1c.jpg", left: 0, w: 36, h: 172, opacity: 0.4 },
  { src: "/hero/deck-2c.jpg", left: 58, w: 64, h: 188, opacity: 0.55 },
  { src: "/hero/deck-3c.jpg", left: 143, w: 102, h: 210, opacity: 0.8 },
  { src: "/hero/deck-4c.jpg", left: 265, w: 150, h: 236, opacity: 1 },
  { src: "/hero/deck-5c.jpg", left: 436, w: 194, h: 260, opacity: 1 },
  { src: "/hero/deck-6c.jpg", left: 651, w: 213, h: 273, opacity: 1 },
  { src: "/hero/deck-7c.jpg", left: 884, w: 194, h: 270, opacity: 1 },
  { src: "/hero/deck-8c.jpg", left: 1099, w: 150, h: 252, opacity: 1 },
  { src: "/hero/deck-9c.jpg", left: 1270, w: 102, h: 229, opacity: 0.8 },
  { src: "/hero/deck-10c.jpg", left: 1393, w: 64, h: 207, opacity: 0.55 },
  { src: "/hero/deck-11c.jpg", left: 1477, w: 36, h: 190, opacity: 0.4 },
];

const AVATARS = [
  "/Avatar.png",
  "/Avatar2.png",
  "/Avatar3.png",
  "/Avatar4.png",
  "/Avatar5.png",
  "/Avatar6.png",
  "/Avatar7.png",
  "/Avatar8.png",
  "/Avatar9.png",
  "/Avatar10.png",
];

export default function HeroSection() {
  const { selectedState, hasStoredState } = useWebLayout();
  const [showStateModal, setShowStateModal] = useState(false);

  const displayState = selectedState || "West Virginia";
  const stateHref = hasStoredState
    ? `/${stateToSlug(selectedState)}`
    : undefined;

  function onStartClick() {
    if (!hasStoredState) {
      setShowStateModal(true);
    }
  }

  const ctaLabel = hasStoredState
    ? `Start Your Free ${selectedState} Practice Test`
    : "Start Your Free Practice Test";

  const ctaClassName =
    "group inline-flex h-14 items-center gap-2 rounded-full bg-linear-to-r from-[#3b82f6] to-[#1e40af] pr-1 pl-5 font-semibold text-white [filter:drop-shadow(0px_12px_8px_rgba(0,0,0,0.08))_drop-shadow(0px_4px_3px_rgba(0,0,0,0.03))]";

  const ctaContent = (
    <>
      <span className="text-base leading-6 font-semibold whitespace-nowrap">
        {ctaLabel}
      </span>
      <span className="flex size-12 items-center justify-center rounded-full bg-[rgba(255,255,255,0.16)]">
        <ArrowUpRight className="size-6 text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </>
  );

  return (
    <section className="relative overflow-hidden bg-background px-5 pt-8 pb-14 lg:pt-12">
      <div className="mx-auto flex w-full flex-col items-center">
        {/* Heading + subtitle + CTA — centered, matches Figma node 1659:7496 */}
        <div className="flex flex-col items-center gap-8">
          <div className="flex max-w-[733px] flex-col items-center gap-4 text-center">
            <Heading as="h1" className="leading-tight! lg:leading-[72px]!">
              Ace your{" "}
              <span className="relative inline-block whitespace-nowrap">
                {displayState}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 429 16"
                  preserveAspectRatio="none"
                  fill="none"
                  className="pointer-events-none absolute bottom-[-0.06em] left-0 h-[0.22em] w-full"
                >
                  <path
                    d="M397.324 9.57165C382.141 9.57165 366.958 9.68155 351.775 9.54168C339.6 9.43178 327.425 8.84232 315.233 8.77238C304.695 8.71244 294.087 8.73241 283.621 9.35185C261.638 10.6407 239.762 12.549 217.762 13.7579C207.171 14.3374 196.812 13.3682 186.488 11.0703C169.65 7.32368 152.188 9.13203 135.047 11.0903C125.044 12.2292 115.13 13.598 105.126 14.6671C96.2442 15.6162 88.3411 14.727 81.1323 11.1402C73.87 7.5235 64.5074 8.42268 56.106 9.53168C43.8955 11.1302 31.952 13.3782 19.9373 15.4364C12.408 16.7252 5.60858 15.876 1.01628 12.1393C-0.496688 10.9104 -0.12289 8.5126 0.856089 6.94401C1.26548 6.28461 6.14254 5.71511 7.8869 6.24463C13.4582 7.93311 18.3353 6.78417 23.515 5.92494C38.7514 3.39722 54.0235 0.689665 70.1678 1.45897C75.4009 1.70875 81.3459 2.38814 85.4042 4.05663C93.6454 7.45357 102.118 6.81412 110.929 5.96489C126.112 4.49621 141.224 2.7678 156.46 1.52892C167.799 0.609745 178.941 1.39902 189.835 3.76689C203.487 6.72422 217.816 5.96491 231.895 5.05573C255.426 3.5371 278.833 1.20919 302.417 0.140154C315.446 -0.449315 328.725 0.999367 341.914 1.1892C359.536 1.43897 377.175 1.2991 394.815 1.43897C403.91 1.50891 413.059 1.61882 422.084 2.19829C424.611 2.35815 428.296 4.05662 428.83 5.38542C429.916 8.06301 425.59 8.25285 421.995 8.36275C413.789 8.6325 405.584 8.92222 397.378 9.21196C397.378 9.33185 397.36 9.45175 397.342 9.56165L397.324 9.57165Z"
                    fill="#22C55E"
                  />
                </svg>
              </span>{" "}
              DMV Driving Test.
            </Heading>
            <Paragraph size="xl">
              Stop wasting hours on the manual. DriveLane adapts to how you
              learn — with smart practice tests, AI explanations, and a
              guaranteed path to your license.
            </Paragraph>
          </div>

          {stateHref ? (
            <Link href={stateHref} className={ctaClassName}>
              {ctaContent}
            </Link>
          ) : (
            <button type="button" onClick={onStartClick} className={ctaClassName}>
              {ctaContent}
            </button>
          )}
        </div>

        {/* Social proof — stars, avatar stack, stat line — sits directly UNDER the CTA
            and ABOVE the deck, matching the Figma hero order (node 1897:1800). */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="size-6 fill-[#FACC15] text-[#FACC15]"
                strokeWidth={0}
              />
            ))}
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center">
              {AVATARS.map((src, i) => (
                <span
                  key={src}
                  className={`relative size-10 overflow-hidden rounded-full border-2 border-white ${
                    i > 0 ? "-ml-4" : ""
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </span>
              ))}
            </div>
            <p className="text-center text-base leading-6">
              <span className="font-bold text-neutral-900">4.8M+ drivers</span>
              <span className="text-neutral-700"> prepared · </span>
              <span className="font-bold text-neutral-900">97%</span>
              <span className="text-neutral-700"> pass first try</span>
            </p>
          </div>
        </div>

        {/* Fanned portrait deck (Figma node 1659:7443) — see GALLERY_CARDS note.
            Cards are BOTTOM-ALIGNED on a common baseline (`bottom-[34px]`): all bottoms
            sit on one line and only the TOPS arc up toward the center (taller center
            cards rise higher) → the Figma silhouette. NOT vertically centered. Fixed px
            heights keep the arc identical across browsers. */}
        {/* overflow-x-clip (NOT overflow-hidden): clips only the horizontal edge slivers
            at narrow viewports, while letting each card's soft downward shadow + the glow
            bleed past the bottom and fade naturally — overflow-hidden clipped them into a
            hard horizontal line at the deck's bottom edge. */}
        <div className="mt-14 flex justify-center overflow-x-clip lg:mt-16">
          <div className="relative h-[320px] shrink-0" style={{ width: DECK_W }}>
            {/* Whisper-subtle neutral-cool bloom behind the deck — just enough to read
                as depth, NOT a visible colored patch. Anchored to the bottom so it sits
                behind the bottom-aligned card mass; fades to transparent before its edges
                so the outer overflow-hidden never hard-clips it. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2"
              style={{
                width: DECK_W + 220,
                height: 320,
                background:
                  "radial-gradient(ellipse 44% 58% at 50% 60%, rgba(200,210,232,0.55) 0%, rgba(204,213,230,0.26) 44%, rgba(210,216,228,0) 74%)",
                zIndex: 0,
              }}
            />
            {GALLERY_CARDS.map((card, i) => (
              <div
                key={card.src}
                className="absolute bottom-[34px] overflow-hidden rounded-[18px] border-[3px] border-white shadow-[0_0_22px_rgba(196,210,238,0.45),0_4px_10px_rgba(28,48,86,0.07),0_15px_28px_rgba(28,48,86,0.11),0_32px_52px_rgba(28,48,86,0.13)]"
                style={{
                  left: `${card.left}px`,
                  width: `${card.w}px`,
                  height: `${card.h}px`,
                  opacity: card.opacity,
                  zIndex: 20 - Math.abs(i - 5),
                }}
              >
                <Image
                  src={card.src}
                  alt=""
                  fill
                  quality={92}
                  sizes="240px"
                  className="object-cover object-center"
                />
              </div>
            ))}
          </div>
        </div>

        <StateSelectModal
          open={showStateModal}
          onClose={() => setShowStateModal(false)}
        />
      </div>
    </section>
  );
}
