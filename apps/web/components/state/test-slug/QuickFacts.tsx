"use client";

import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import Subheading from "@/components/ui/Subheading";
import { stateAbbreviations } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";
import {
  ArrowRight,
  Car,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Globe,
  MapPin,
  MonitorCheck,
  RotateCcw,
  Timer,
  User,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

type Fact = {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
  href?: string;
  colSpan?: 2;
};

export default function QuickFacts() {
  const { selectedState } = useWebLayout();
  const stateCode = stateAbbreviations[selectedState] ?? "";

  const facts: Fact[] = [
    {
      icon: FileText,
      label: "Questions",
      value: "20",
      description: "Multiple choice, one answer each",
    },
    {
      icon: ClipboardCheck,
      label: "Passing score",
      value: "16 / 20",
      description: "80% required to pass the test.",
    },
    {
      icon: Timer,
      label: "Time limit",
      value: "25 mins",
      description: "Most of the people finish in 15 mins",
    },
    {
      icon: CircleDollarSign,
      label: "Test Fee",
      value: "$15.00",
      description: "Covers three attempts in 12 months",
    },
    {
      icon: RotateCcw,
      label: "If you fail",
      value: "Wait 7 days",
      description: "Three strikes ends the application",
    },
    {
      icon: Car,
      label: "Supervised hours",
      value: "40 hrs",
      description: "10 hours of driving at night required",
    },
    {
      icon: User,
      label: "Minimum age",
      value: "14 yrs",
      description: "Driver ed required under 17½",
    },
    {
      icon: Globe,
      label: "Test languages",
      value: "2",
      description: "English and Spanish available",
    },
    {
      icon: MonitorCheck,
      label: "Online testing",
      value: "Yes",
      description: "KnowToDrive online knowledge test",
    },
    {
      icon: MapPin,
      label: "Where",
      value: `${stateCode} DMV offices`,
      description: `Find ${selectedState} DMV locations`,
      href: "#",
    },
    {
      icon: ClipboardList,
      label: "What to bring",
      value: "ID + SSN + residency proof + permit fee",
      description: "Open the checklist",
      href: "#",
      colSpan: 2,
    },
  ];

  return (
    <section className="py-15 lg:py-30 px-5">
      <div className="max-w-container mx-auto space-y-10">
        <div className="mx-auto max-w-190 space-y-6 text-center">
          <Subheading text="QUICK fACTS" align="center" />
          <Heading>{stateCode} permit test at a glance</Heading>
          <Paragraph size="xl">
            Everything the handbook buries on page 60, on one screen. Verified
            against the state's published requirements each quarter.
          </Paragraph>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-neutral-200 rounded-2xl bg-white overflow-hidden">
          {facts.map((fact, index) => {
            const isLastItem = index === facts.length - 1;
            const isLastTabletColumn = index % 2 === 1 || isLastItem;
            const isLastTabletRow =
              index >= facts.length - (facts.length % 2 === 0 ? 2 : 1);
            const isLastDesktopColumn = index % 4 === 3 || isLastItem;
            const isLastDesktopRow =
              index >=
              facts.length - (facts.length % 4 === 0 ? 4 : facts.length % 4);

            return (
              <div
                key={fact.label}
                className={[
                  "p-6 border-neutral-200 space-y-3",
                  fact.colSpan === 2 ? "md:col-span-2" : "",
                  isLastItem ? "" : "border-b",
                  isLastTabletColumn ? "md:border-r-0" : "md:border-r",
                  isLastTabletRow ? "md:border-b-0" : "md:border-b",
                  isLastDesktopColumn ? "lg:border-r-0" : "lg:border-r",
                  isLastDesktopRow ? "lg:border-b-0" : "lg:border-b",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <fact.icon className="min-w-15 min-h-15 p-3.5 rounded-lg bg-blue-50 text-blue-500 shrink-0" />
                  <div className="space-y-1">
                    <Paragraph>{fact.label}</Paragraph>
                    <Paragraph
                      size="2xl"
                      className="font-semibold font-sora"
                      color="dark"
                    >
                      {fact.value}
                    </Paragraph>
                  </div>
                </div>

                {fact.href ? (
                  <Button
                    variant="ghost"
                    href={fact.href}
                    className="p-0!"
                    size="sm"
                  >
                    {fact.description}
                  </Button>
                ) : (
                  <Paragraph>{fact.description}</Paragraph>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-6 justify-between lg:flex-nowrap flex-wrap">
          <div className="relative overflow-hidden bg-linear-to-l from-blue-500 to-blue-800 rounded-3xl px-6 py-8 border lg:w-[60%] w-full">
            <img src="/logomark.svg" className="absolute top-0 right-0" />
            <div className="space-y-6 z-10 relative">
              <Heading size="xs" color="white" className="mb-1.5">
                Schedule your {selectedState} DMV appointment
              </Heading>
              <Paragraph className="text-neutral-300!">
                Field offices release slots 90 days out. Book before you finish
                studying, not after.
              </Paragraph>
              <Button variant="secondary" size="sm">
                Start Your First Free Practice Test <ArrowRight />
              </Button>
            </div>
          </div>
          <div className="bg-white rounded-3xl px-6 py-8 border lg:w-[40%] w-full space-y-3">
            <Subheading text="Fun Fact" />
            <Paragraph size="lg">
              {selectedState} prints a{" "}
              <strong className="text-neutral-900">vertical</strong> license for
              anyone under 21 — so the card itself tells a clerk your age before
              you say a word. It flips to horizontal at your first renewal after
              21.
            </Paragraph>
          </div>
        </div>
      </div>
    </section>
  );
}
