import { Check } from "lucide-react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";

/**
 * "Everything you need to ace it" — a centered header over a row of three white
 * cards (Car / CDL / Bike), each with a tinted vehicle-icon tile, a large Sora
 * title, and three checkmark bullets. Pixel-matched to Figma node 1897:2478
 * (file QOJ34F4OPHkJ5LFrJt9eCA). Glyphs are the exact Figma vectors recolored
 * per card (red / yellow / green).
 */
type Card = {
  icon: string;
  tile: string;
  title: string;
  points: string[];
};

const CARDS: Card[] = [
  {
    icon: "/vehicles/car-red.svg",
    tile: "#FEE2E2",
    title: "Car",
    points: [
      "Real DMV style practice questions.",
      "Clear explanation for every answer.",
      "Ideal for first time drivers.",
    ],
  },
  {
    icon: "/vehicles/truck-yellow.svg",
    tile: "#FEF9C3",
    title: "CDL",
    points: [
      "Practice test for CDL exams.",
      "Covers core topics and endorsements.",
      "Track Readiness for before test day.",
    ],
  },
  {
    icon: "/vehicles/bike-green.svg",
    tile: "#DCFCE7",
    title: "Bike",
    points: [
      "Motorcycle specific DMV questions.",
      "Road rules and safety essentials.",
      "Built for quick, focuses practice.",
    ],
  },
];

export default function WhyChooseSection() {
  return (
    <section className="bg-background2 py-16 lg:py-[120px]">
      <div className="mx-auto max-w-container px-5">
        {/* Header */}
        <div className="flex flex-col items-center gap-6 text-center">
          <p className="flex items-center gap-1.5 border-b border-blue-100 px-[14px] pt-[5px] pb-[6px] text-xs font-bold tracking-[1.2px] text-blue-700 uppercase">
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

        {/* Three cards */}
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3 lg:mt-[41px]">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="flex flex-col gap-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-[0px_20px_40px_-10px_rgba(11,11,13,0.1)] lg:p-12"
            >
              <div className="flex items-center gap-4 lg:gap-6">
                <span
                  className="flex size-15 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: card.tile }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.icon} alt="" aria-hidden className="w-10" />
                </span>
                <h3 className="font-sora text-4xl font-semibold tracking-[-0.96px] text-[#0b0b0d] lg:text-5xl lg:leading-[56px]">
                  {card.title}
                </h3>
              </div>
              <ul className="flex flex-col gap-3">
                {card.points.map((point) => (
                  <li key={point} className="flex items-center gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded bg-blue-500">
                      <Check className="size-4 text-white" strokeWidth={3} />
                    </span>
                    <span className="text-base leading-6 text-neutral-700">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
