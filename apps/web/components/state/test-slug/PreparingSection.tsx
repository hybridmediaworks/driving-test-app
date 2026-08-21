"use client";

import { useEffect, useState } from "react";
import type { Handbook, PaginatedResponse } from "@driving-test-app/shared";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import Subheading from "@/components/ui/Subheading";
import { api } from "@/lib/api";
import { stateAbbreviations } from "@/lib/usStates";
import { useResolvedQuiz } from "@/lib/useResolvedQuiz";
import { useWebLayout } from "@/lib/web-layout-context";

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

export default function PreparingSection({ testSlug }: { testSlug: string }) {
  const { selectedState, selectedVehicle } = useWebLayout();
  const stateCode = stateAbbreviations[selectedState] ?? "";
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";
  const quiz = useResolvedQuiz(testSlug);
  const [handbook, setHandbook] = useState<Handbook | null>(null);

  useEffect(() => {
    if (!stateCode) return;
    let cancelled = false;

    api
      .get<PaginatedResponse<Handbook>>(`/handbooks?state=${stateCode}&vehicle_type=${vehicleType}`)
      .then((res) => {
        if (!cancelled) setHandbook(res.data[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setHandbook(null);
      });

    return () => {
      cancelled = true;
    };
  }, [stateCode, vehicleType]);

  if (!quiz) return null;

  const isDrivingTest = quiz.test_track === "driving_test";

  return (
    <section className="py-15 lg:py-30 px-5 bg-background2">
      <div className="max-w-container mx-auto flex flex-col lg:flex-row gap-5 items-center justify-between">
        <div className="max-w-167.5 space-y-6">
          <Subheading text="WHAT YOU’RE PREPARING FOR" />
          <Heading>
            The {stateCode} {isDrivingTest ? "driving test" : "permit test"} in one paragraph
          </Heading>
          <Paragraph size="lg">
            {quiz.title} is part of our <strong>{quiz.category?.title ?? "practice"}</strong> question set and has{" "}
            <strong>{quiz.total_questions} questions</strong>
            {typeof quiz.passing_score_percent === "number" ? (
              <>
                {" "}
                — you need at least <strong>{quiz.passing_score_percent}% correct</strong> to pass
              </>
            ) : null}
            . All questions are based on the official {selectedState} Driver Handbook.
          </Paragraph>
          {handbook ? (
            <Paragraph size="lg">
              For the full official requirements — fees, required documents, and eligibility — read the real{" "}
              <strong>{handbook.title}</strong>, not a summary.
            </Paragraph>
          ) : (
            <Paragraph size="lg">
              For official requirements — fees, required documents, and eligibility — check your local{" "}
              {selectedState} DMV before test day. DriveLane is an independent study platform, not affiliated
              with the {selectedState} Division of Motor Vehicles.
            </Paragraph>
          )}
          <div className="flex flex-wrap gap-3">
            {handbook && (
              <Button size="lg" variant="ghost" className="p-0!" href={`/handbook/${handbook.id}`}>
                Read the official handbook
              </Button>
            )}
            {quiz.source_url && (
              <Button size="lg" variant="ghost" className="p-0!" href={quiz.source_url}>
                View source
              </Button>
            )}
          </div>
        </div>
        <div className="max-w-149.25">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/what-you-prepare.svg" alt="what-you-prepare" className="w-full" />
        </div>
      </div>
    </section>
  );
}
