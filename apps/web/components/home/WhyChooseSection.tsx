"use client";

import Image from "next/image";
import { type ComponentType, useState } from "react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";

type IconProps = { className?: string };

/* Vehicle glyphs — the exact Figma vectors (node 1659:8095), saved as SVG assets. */
function CarIcon({ className }: IconProps) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/vehicles/car.svg" alt="" aria-hidden className={className} />;
}

function TruckIcon({ className }: IconProps) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/vehicles/truck.svg" alt="" aria-hidden className={className} />;
}

function MotorcycleIcon({ className }: IconProps) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/vehicles/bike.svg" alt="" aria-hidden className={className} />;
}

type TestType = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  stat: string;
};

/**
 * "Why Drivers Choose DriveLane" — a centered header over a two-column split:
 * a vertical accordion of test types on the left (one expanded at a time, blue
 * accent + green pass-rate line) and a large rounded driver photo on the right.
 * Figma "Option B" home redesign (node 1659:8095).
 */
const TEST_TYPES: TestType[] = [
  {
    icon: CarIcon,
    title: "Car Driving Test Prep",
    description:
      "State-specific banks mirrored from the real DMV pool, with instant explanations on every miss.",
    stat: "98.6% first-attempt pass rate",
  },
  {
    icon: TruckIcon,
    title: "CDL Driving Test Prep",
    description:
      "Class A, B, and C prep with air brakes, combination, and hazmat sections drawn from the FMCSA pool.",
    stat: "94.2% first-attempt pass rate",
  },
  {
    icon: MotorcycleIcon,
    title: "Bike",
    description:
      "Motorcycle hazard-perception and maneuver drills tuned to your state's rider exam.",
    stat: "96.1% first-attempt pass rate",
  },
];

export default function WhyChooseSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="bg-background2 py-16 lg:py-[120px]">
      <div className="mx-auto max-w-container px-5">
        {/* Header */}
        <div className="flex flex-col items-center gap-6 text-center">
          <p className="flex items-center gap-1.5 border-b border-blue-100 px-[14px] pt-[5px] pb-[6px] text-xs font-bold uppercase tracking-[1.2px] text-blue-700">
            <span aria-hidden="true">✦</span>
            Why Drivers Choose Drive Lane
          </p>
          <div className="flex flex-col items-center gap-4">
            <Heading as="h2" className="text-center">
              Everything you need to ace it
            </Heading>
            <Paragraph className="max-w-[650px] text-center" size="xl">
              Designed by driving instructors and engineers to give you the exact
              preparation the DMV actually tests you on.
            </Paragraph>
          </div>
        </div>

        {/* Split: accordion + photo */}
        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[670fr_630fr] lg:items-stretch lg:gap-[60px]">
          {/* Left — vertical accordion */}
          <div className="flex flex-col gap-6 lg:justify-between">
            {TEST_TYPES.map((type, index) => {
              const active = index === activeIndex;
              const Icon = type.icon;
              return (
                <button
                  key={type.title}
                  type="button"
                  aria-expanded={active}
                  onClick={() => setActiveIndex(index)}
                  className={[
                    "w-full cursor-pointer overflow-hidden p-6 text-left transition-all duration-300",
                    active
                      ? "rounded-3xl bg-[radial-gradient(120%_130%_at_0%_8%,#ffffff_0%,#dbeafe_100%)] shadow-[0px_8px_24px_0px_rgba(14,17,22,0.08)]"
                      : "rounded-xl hover:bg-white/50",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-6">
                    <span className="flex size-15 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                      <Icon className="w-10" />
                    </span>
                    <div className="flex flex-1 flex-col gap-3">
                      <h3
                        className={[
                          "font-sora font-semibold tracking-[-0.96px]",
                          "text-[32px] leading-[1.12] sm:text-[40px] lg:text-[48px] lg:leading-[56px]",
                          active ? "text-blue-600" : "text-neutral-900",
                        ].join(" ")}
                      >
                        {type.title}
                      </h3>
                      {active && (
                        <>
                          <Paragraph
                            size="md"
                            className="max-w-[371px]"
                          >
                            {type.description}
                          </Paragraph>
                          <p className="text-base leading-6 text-green-500">
                            {type.stat}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right — driver photo */}
          <div className="relative aspect-[630/483] w-full overflow-hidden rounded-[32px] bg-white shadow-[0px_24px_60px_0px_rgba(14,17,22,0.2)]">
            <Image
              src="/hero/whychoose-driver.jpg"
              alt="A driver behind the wheel of a car"
              fill
              quality={92}
              sizes="(max-width: 1024px) 100vw, 630px"
              className="object-cover object-center"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
