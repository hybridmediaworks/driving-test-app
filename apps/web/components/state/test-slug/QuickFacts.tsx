"use client";

import { useEffect, useState } from "react";
import type { State } from "@driving-test-app/shared";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import Subheading from "@/components/ui/Subheading";
import GoFurtherSection from "@/components/state/GoFurtherSection";
import { api } from "@/lib/api";
import { stateAbbreviations } from "@/lib/usStates";
import { useResolvedQuiz } from "@/lib/useResolvedQuiz";
import { useWebLayout } from "@/lib/web-layout-context";
import { ClipboardCheck, FileText, Gem, Globe, MapPin, Timer, type LucideIcon } from "lucide-react";

type Fact = {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
  href?: string;
};

function formatMinutes(durationSeconds: number | null | undefined): string | null {
  if (!durationSeconds) return null;
  const minutes = Math.round(durationSeconds / 60);
  return minutes > 0 ? `${minutes} min` : null;
}

export default function QuickFacts({ testSlug }: { testSlug: string }) {
  const { selectedState } = useWebLayout();
  const stateCode = stateAbbreviations[selectedState] ?? "";
  const quiz = useResolvedQuiz(testSlug);
  const [stateInfo, setStateInfo] = useState<State | null>(null);

  useEffect(() => {
    if (!stateCode) return;
    let cancelled = false;

    api
      .get<{ data: State[] }>("/states")
      .then((res) => {
        if (!cancelled) setStateInfo(res.data.find((s) => s.code === stateCode) ?? null);
      })
      .catch(() => {
        if (!cancelled) setStateInfo(null);
      });

    return () => {
      cancelled = true;
    };
  }, [stateCode]);

  if (!quiz) return null;

  const isDrivingTest = quiz.test_track === "driving_test";
  const agencyName = stateInfo?.agency_name ?? null;

  const facts: Fact[] = [
    {
      icon: FileText,
      label: "Questions",
      value: String(quiz.total_questions),
      description: "Multiple choice, one answer each",
    },
    {
      icon: ClipboardCheck,
      label: "Passing score",
      value: typeof quiz.passing_score_percent === "number" ? `${quiz.passing_score_percent}%` : "Not set",
      description:
        typeof quiz.passing_score_percent === "number" ? "Required to pass this test" : "Not published for this test",
    },
    {
      icon: Timer,
      label: "Time limit",
      value: formatMinutes(quiz.duration_seconds) ?? "Not set",
      description: quiz.duration_seconds ? "Typical time to finish" : "Not published for this test",
    },
    {
      icon: Gem,
      label: "Access",
      value: quiz.is_premium ? "Premium" : "Free",
      description: quiz.is_premium ? "Included with any paid plan" : "Free to take, no signup required",
    },
    {
      icon: Globe,
      label: "Category",
      value: quiz.category?.title ?? "General",
      description: "Where this test sits in the practice ladder",
    },
    ...(agencyName
      ? [
          {
            icon: MapPin,
            label: "Issuing agency",
            value: agencyName,
            description: `Find ${selectedState} ${agencyName} locations`,
            href: stateInfo?.dmv_website_url ?? undefined,
          },
        ]
      : []),
  ];

  return (
    <section className="py-15 lg:py-30 px-5">
      <div className="max-w-container mx-auto space-y-10">
        <div className="mx-auto max-w-190 space-y-6 text-center">
          <Subheading text="QUICK fACTS" align="center" />
          <Heading>
            {stateCode} {isDrivingTest ? "driving test" : "permit test"} at a glance
          </Heading>
          <Paragraph size="xl">Real numbers from this test, sourced from the official {selectedState} driver handbook.</Paragraph>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-neutral-200 rounded-2xl bg-white overflow-hidden">
          {facts.map((fact, index) => {
            const isLastItem = index === facts.length - 1;
            const columns = 3;
            const isLastRowItem = index % columns === columns - 1 || isLastItem;
            const isLastRow = index >= facts.length - (facts.length % columns === 0 ? columns : facts.length % columns);

            return (
              <div
                key={fact.label}
                className={[
                  "p-6 border-neutral-200 space-y-3",
                  isLastItem ? "" : "border-b",
                  isLastRowItem ? "lg:border-r-0" : "lg:border-r",
                  isLastRow ? "lg:border-b-0" : "lg:border-b",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <fact.icon className="min-w-15 min-h-15 p-3.5 rounded-lg bg-blue-50 text-blue-500 shrink-0" />
                  <div className="space-y-1">
                    <Paragraph>{fact.label}</Paragraph>
                    <Paragraph size="2xl" className="font-semibold font-sora" color="dark">
                      {fact.value}
                    </Paragraph>
                  </div>
                </div>
                <Paragraph>{fact.description}</Paragraph>
                {fact.href && (
                  <a href={fact.href} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline">
                    Visit official site
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <GoFurtherSection />
    </section>
  );
}
