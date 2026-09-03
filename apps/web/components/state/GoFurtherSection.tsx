"use client";

import Link from "next/link";
import {
  BookMarked,
  BookOpen,
  Compass,
  Layers,
  ListChecks,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { stateAbbreviations } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

type ResourceCard = {
  icon: LucideIcon;
  title: string;
  description: string;
  linkText: string;
  href: string;
};

function Card({ card, className = "" }: { card: ResourceCard; className?: string }) {
  const { icon: Icon, title, description, linkText, href } = card;

  return (
    <Link
      href={href}
      className={`flex flex-col items-start gap-4 rounded-3xl border border-background2 bg-white p-8 drop-shadow-[0px_20px_20px_rgba(11,11,13,0.1)] transition-transform duration-300 hover:-translate-y-1 ${className}`}
    >
      <span className="flex size-12.5 items-center justify-center rounded-[11px] bg-blue-500/10 text-blue-600">
        <Icon className="size-6" />
      </span>
      <h3 className="font-sora text-2xl leading-8 font-semibold text-neutral-900 lg:text-[30px] lg:leading-[38px]">
        {title}
      </h3>
      <Paragraph size="sm" color="muted" className="flex-1">
        {description}
      </Paragraph>
      <span className="inline-flex items-center gap-1.5 text-sm leading-6 font-semibold text-blue-700">
        {linkText} <span aria-hidden>&rarr;</span>
      </span>
    </Link>
  );
}

/**
 * "Helpful resources" — the three-column masonry from Figma node 4147:8486, rebuilt over the
 * resources that actually exist for every state/vehicle combination. The design's two
 * "[VIDEO] checklist walkthrough" tiles are placeholders for footage this app doesn't have, so
 * those slots render as regular resource cards rather than play buttons that play nothing; the
 * duplicated "Locations, hours, and what to bring…" body copy is likewise placeholder text and is
 * replaced per card with what that destination really offers.
 */
export default function GoFurtherSection() {
  const { selectedState, selectedVehicle, selectedTestType } = useWebLayout();
  const stateCode = stateAbbreviations[selectedState];
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";
  const query = `state=${stateCode}&vehicle_type=${vehicleType}`;

  const cards: ResourceCard[] = [
    {
      icon: BookMarked,
      title: "Cheat sheets",
      description: `Condensed study guides for the ${selectedState} test — download and keep for quick reference.`,
      linkText: "Browse cheat sheets",
      href: `/cheat-sheets?${query}`,
    },
    {
      icon: ShieldCheck,
      title: "Pass guarantee",
      description:
        "Pass your written test on the first attempt or get your money back — here are the terms.",
      linkText: "See the guarantee",
      href: "/pass-guarantee",
    },
    {
      icon: Layers,
      title: "Road sign flashcards",
      description:
        "Quick-recall practice for the road signs you'll see on the test.",
      linkText: "Study flashcards",
      href: `/flashcards?${query}`,
    },
    {
      icon: ListChecks,
      title: "More practice tests",
      description: `Browse every ${selectedState} practice test in one place.`,
      linkText: "Browse tests",
      href: `/quizzes?${query}&test_track=${selectedTestType}`,
    },
    {
      icon: BookOpen,
      title: "The exam simulator",
      description:
        "A full-length timed run under the same conditions as the real exam.",
      linkText: "Open the simulator",
      href: "/exam-simulator",
    },
    {
      icon: Compass,
      title: "How DriveLane works",
      description:
        "The whole study path, from your first practice test to license in hand.",
      linkText: "See the path",
      href: "/how-it-works",
    },
  ];

  return (
    <section className="px-5 py-15 lg:py-30">
      <div className="mx-auto max-w-container space-y-11">
        <div className="max-w-[760px] space-y-4">
          <Heading as="h2">Helpful resources</Heading>
          <Paragraph size="xl">
            Small tools that clear the path from &quot;thinking about it&quot;
            to &quot;license in hand.&quot;
          </Paragraph>
        </div>

        {/* Figma's 500 / 324 / 501 masonry — two cards per outer column, two equal cards in the
            narrow middle one. Stacks to a single column below lg. */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-[minmax(0,500fr)_minmax(0,324fr)_minmax(0,501fr)]">
          <div className="flex flex-col gap-5">
            <Card card={cards[0]} />
            <Card card={cards[1]} className="flex-1" />
          </div>
          <div className="flex flex-col gap-5">
            <Card card={cards[2]} className="flex-1" />
            <Card card={cards[3]} className="flex-1" />
          </div>
          <div className="flex flex-col gap-5">
            <Card card={cards[4]} />
            <Card card={cards[5]} className="flex-1" />
          </div>
        </div>
      </div>
    </section>
  );
}
