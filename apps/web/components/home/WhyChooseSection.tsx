"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import StateSelectModal from "@/components/home/StateSelectModal";
import Button from "@/components/ui/Button";
import HandUnderline from "@/components/ui/HandUnderline";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { stateToSlug } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

type Art = { src: string; width: number; height: number };

type Card = {
  vehicle: string;
  title: string;
  /** Artwork that already contains the card surface, icon and check marks; text is laid over it. */
  art: Art;
  segment: string;
  points: string[];
};

const CARDS: Card[] = [
  {
    vehicle: "Car",
    title: "Car",
    art: { src: "/license-types/car-card-remastered.png", width: 1000, height: 704 },
    segment: "",
    points: [
      "Real DMV style practice questions.",
      "Clear explanations for every answer.",
      "Ideal for first time drivers.",
    ],
  },
  {
    vehicle: "CDL",
    title: "CDL",
    art: { src: "/license-types/card-cdl-remastered.png", width: 1000, height: 704 },
    segment: "cdl",
    points: [
      "Practice tests for CDL exams.",
      "Covers core topics and endorsements.",
      "Track your readiness before test day.",
    ],
  },
  {
    vehicle: "Motorcycle",
    title: "Motorcycle",
    art: { src: "/license-types/card-motorcycle-remastered.png", width: 1000, height: 704 },
    segment: "motorcycle",
    points: [
      "Motorcycle specific DMV questions.",
      "Road rules and safety essentials.",
      "Built for quick, focused practice.",
    ],
  },
];

const CARD_SIZES = "(min-width: 1024px) 33vw, 100vw";

function SteeringWheelIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 14.5V21M9.9 10.4 4.2 7.1M14.1 10.4l5.7-3.3" />
    </svg>
  );
}

// The artwork is 1000x704 with the card drawn at 60,20 -> 940,602. The image is oversized and
// offset so that drawn card fills this box exactly, and every overlay is placed as a percentage
// of the box (type in cqw), so the text stays registered to the baked-in icon and check marks.
function LicenseCard({
  card,
  href,
  onCtaClick,
}: {
  card: Card;
  href?: string;
  onCtaClick: () => void;
}) {
  return (
    <article className="relative mx-auto aspect-[880/582] w-full max-w-[640px] [container-type:inline-size] lg:max-w-none lg:self-center">
      <Image
        src={card.art.src}
        width={card.art.width}
        height={card.art.height}
        sizes={CARD_SIZES}
        alt=""
        aria-hidden
        className="pointer-events-none absolute top-[-3.44%] left-[-6.82%] h-auto w-[113.64%] max-w-none select-none"
      />

      <h3 className="absolute top-[18.6%] left-[21.3%] -translate-y-1/2 font-sora text-[8.4cqw] leading-none font-bold tracking-tight text-neutral-900">
        {card.title}
      </h3>

      <ul>
        {card.points.map((point, i) => (
          <li
            key={point}
            style={{ top: `${37.8 + i * 11}%` }}
            className="absolute left-[11.9%] -translate-y-1/2 text-[max(11px,2.95cqw)] leading-none whitespace-nowrap text-neutral-700"
          >
            {point}
          </li>
        ))}
      </ul>

      <Button
        href={href}
        onClick={onCtaClick}
        text="Start Practicing"
        icon={ArrowRight}
        iconPosition="right"
        size="sm"
        className="absolute top-[70.1%] left-[4.55%] h-[17.7%] w-[39.4%] gap-[2cqw]! p-0! text-[max(11px,3.1cqw)]! shadow-[0_1cqw_2.4cqw_-0.8cqw_rgba(37,99,235,0.55)] [&_svg]:size-[3.4cqw]"
      />
    </article>
  );
}

export default function WhyChooseSection() {
  const { selectedState, hasStoredState, setSelectedVehicle } = useWebLayout();
  const [showStateModal, setShowStateModal] = useState(false);

  function hrefFor(card: Card) {
    if (!hasStoredState) return undefined;
    const slug = stateToSlug(selectedState);
    return card.segment ? `/${slug}/${card.segment}` : `/${slug}`;
  }

  function onCtaClick(card: Card) {
    setSelectedVehicle(card.vehicle);
    if (!hasStoredState) setShowStateModal(true);
  }

  return (
    <section
      aria-labelledby="choose-license-type"
      className="relative overflow-hidden py-16 lg:py-[120px]"
    >
      <Image
        src="/license-types/section-bg.png"
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        className="pointer-events-none absolute inset-0 object-cover object-top select-none"
      />

      <div className="relative mx-auto max-w-container px-5">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100/70 px-4 py-2 text-xs font-bold tracking-[1.2px] text-blue-700 uppercase dark:bg-blue-500/15 dark:text-blue-300">
            <span className="grid size-5 shrink-0 place-items-center rounded-md bg-blue-600 text-white">
              <SteeringWheelIcon className="size-3.5" />
            </span>
            Choose your license type
          </span>

          <Heading as="h2" id="choose-license-type" className="tracking-[-0.02em]">
            Get ready for the{" "}
            <span className="relative inline-block whitespace-nowrap">
              road ahead
              <HandUnderline color="#22C55E" />
            </span>
          </Heading>

          <Paragraph className="max-w-[650px]" size="xl">
            Practice real test questions, learn the rules, and build confidence for your DMV
            exam. Choose your vehicle type to get started.
          </Paragraph>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:mt-14 lg:grid-cols-3">
          {CARDS.map((card) => (
            <LicenseCard
              key={card.vehicle}
              card={card}
              href={hrefFor(card)}
              onCtaClick={() => onCtaClick(card)}
            />
          ))}
        </div>
      </div>

      <StateSelectModal open={showStateModal} onClose={() => setShowStateModal(false)} />
    </section>
  );
}
