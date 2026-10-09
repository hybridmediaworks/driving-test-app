"use client";

import { ArrowRight, Check } from "lucide-react";
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
  icon: Art;
  background: string;
  /** Flat tint sampled from the artwork, so the card stays coloured where the art is letterboxed. */
  tint: string;
  segment: string;
  points: string[];
  check: string;
};

const CARDS: Card[] = [
  {
    vehicle: "Car",
    title: "Car",
    icon: { src: "/license-types/car-icon.png", width: 146, height: 146 },
    background: "/license-types/card-car.png",
    tint: "#F6F8FD",
    segment: "",
    points: [
      "Real DMV style practice questions.",
      "Clear explanations for every answer.",
      "Ideal for first time drivers.",
    ],
    check: "bg-blue-500",
  },
  {
    vehicle: "CDL",
    title: "CDL",
    icon: { src: "/license-types/truck-icon.png", width: 142, height: 142 },
    background: "/license-types/card-cdl.png",
    tint: "#FDFAF6",
    segment: "cdl",
    points: [
      "Practice tests for CDL exams.",
      "Covers core topics and endorsements.",
      "Track your readiness before test day.",
    ],
    check: "bg-amber-400",
  },
  {
    vehicle: "Motorcycle",
    title: "Motorcycle",
    icon: { src: "/license-types/moto-icon.png", width: 151, height: 151 },
    background: "/license-types/card-motorcycle.png",
    tint: "#F5FCF7",
    segment: "motorcycle",
    points: [
      "Motorcycle specific DMV questions.",
      "Road rules and safety essentials.",
      "Built for quick, focused practice.",
    ],
    check: "bg-green-500",
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-[#e6f0ff] via-[#f4f8ff] to-background dark:from-blue-500/10 dark:via-blue-500/5 dark:to-transparent"
      />

      {/* Wider than the page's usual max-w-container (1360px): at that width each card is ~426px
          and the bullets can't fit on one line without running across the vehicle in the card
          art. 1600px puts the cards near the ~566px the design was drawn at. */}
      <div className="relative mx-auto max-w-[1600px] px-5">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100/70 px-4 py-2 text-xs font-bold tracking-[1.2px] text-blue-700 uppercase dark:bg-blue-500/15 dark:text-blue-300">
            <span className="grid size-5 shrink-0 place-items-center rounded-md bg-blue-600 text-white">
              <SteeringWheelIcon className="size-3.5" />
            </span>
            Choose your license type
          </span>

          <Heading as="h2" weight="bold" id="choose-license-type">
            Get ready for the{" "}
            <span className="relative inline-block whitespace-nowrap text-blue-600">
              road ahead
              <HandUnderline color="#2563EB" />
            </span>
          </Heading>

          <Paragraph className="max-w-[650px]" size="xl">
            Practice real test questions, learn the rules, and build confidence for your DMV
            exam. Choose your vehicle type to get started.
          </Paragraph>
        </div>

        {/* One column until lg: three columns below that leaves each card too narrow for the
            bullets, and a full-width card still has room for the vehicle art on the right. */}
        <div className="mt-10 grid grid-cols-1 gap-5 lg:mt-14 lg:grid-cols-3">
          {CARDS.map((card) => (
            <article
              key={card.vehicle}
              style={{ backgroundColor: card.tint }}
              className="relative flex min-h-[22rem] flex-col overflow-hidden rounded-3xl p-6 shadow-card sm:min-h-96 sm:p-8 lg:min-h-80"
            >
              {}
              <Image
                src={card.background}
                fill
                sizes={CARD_SIZES}
                alt=""
                aria-hidden
                className="pointer-events-none object-contain object-bottom select-none lg:object-cover lg:object-right-bottom"
              />

              {}
              <div className="relative flex flex-1 flex-col gap-6">
                <div className="flex items-center gap-4">
                  <Image
                    src={card.icon.src}
                    width={card.icon.width}
                    height={card.icon.height}
                    sizes="56px"
                    alt=""
                    aria-hidden
                    className="size-14 shrink-0 rounded-xl object-contain"
                  />
                  {}
                  <h3 className="font-sora text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                    {card.title}
                  </h3>
                </div>

                {}
                <ul className="flex flex-col gap-3 lg:max-w-[72%]">
                  {card.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${card.check}`}
                      >
                        <Check className="size-3.5 stroke-3 text-white" />
                      </span>
                      <span className="text-sm leading-6 text-neutral-700">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pb-24 sm:pb-12 lg:pb-6">
                  <Button
                    href={hrefFor(card)}
                    onClick={() => onCtaClick(card)}
                    text="Start practicing"
                    icon={ArrowRight}
                    iconPosition="right"
                    size="sm"
                    className="px-5 py-2.5"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <StateSelectModal open={showStateModal} onClose={() => setShowStateModal(false)} />
    </section>
  );
}
