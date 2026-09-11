"use client";

import { useEffect, useState } from "react";
import type { Handbook, PaginatedResponse } from "@driving-test-app/shared";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { api } from "@/lib/api";
import { stateAbbreviations } from "@/lib/usStates";
import { passingScorePercent, questionsToPass } from "@/lib/quizPassMark";
import { useResolvedQuiz } from "@/lib/useResolvedQuiz";
import { useWebLayout } from "@/lib/web-layout-context";
import { ArrowRight } from "lucide-react";

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

/** The soft white → blue wash the two prose cards sit on in Figma (radial, from the top-left
 * corner). Set through a class rather than the theme's `--wash-*` variables because those are
 * only wired up for the home page's inline-styled feature cards. */
const CARD_WASH = "bg-[radial-gradient(140%_120%_at_0%_0%,#ffffff_36%,#dbeafe_100%)] dark:bg-none dark:bg-neutral-800";

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
  const testLabel = isDrivingTest ? "driving test" : "permit test";
  const passPercent = passingScorePercent(quiz);
  const toPass = questionsToPass(quiz);

  return (
    <section className="bg-background2 px-5 py-15 lg:py-30">
      {/* 840 / 120 / 399 — the exact three-part split of the 1359px container in Figma
          (node 4387:458). */}
      <div className="mx-auto flex max-w-container flex-col items-center gap-12 xl:flex-row xl:items-start xl:gap-30">
        <div className="flex w-full flex-col gap-6.25 xl:max-w-210">
          <div className="space-y-6">
            <Heading as="h2">
              The {selectedState} {testLabel} in one paragraph
            </Heading>
            <Paragraph>
              {quiz.title} is part of our {quiz.category?.title ?? "practice"} question set and consists of{" "}
              {quiz.total_questions} multiple-choice questions covering the topics outlined in the current{" "}
              {/* The published handbook title already carries the state name ("Alabama Car
                  Handbook"), so it isn't prefixed again here. */}
              {handbook?.title ?? `${selectedState} Driver’s Manual`}.
              {" "}
              To pass, you must score at least {passPercent}% ({toPass} out of {quiz.total_questions} questions).{" "}
              For the official requirements — fees, required documents, and eligibility — check with your local{" "}
              {selectedState} DMV before test day.
            </Paragraph>
          </div>

          <div className="flex flex-col gap-5 md:flex-row md:items-stretch">
            <div
              className={`flex w-full flex-col justify-center gap-2.5 rounded-2xl p-6 drop-shadow-[0px_20px_20px_rgba(11,11,13,0.1)] md:w-[37%] ${CARD_WASH}`}
            >
              <p className="text-xl leading-7.5 font-semibold text-neutral-900 dark:text-neutral-100">
                Practice before the real thing
              </p>
              <Paragraph>
                Our free online {selectedState} DMV {testLabel} practice test reflects the latest state manual. The
                test simulates real-world conditions and gives immediate feedback on any missed questions.
              </Paragraph>
            </div>

            <div className={`flex w-full flex-col gap-4 rounded-3xl p-6 drop-shadow-[0px_20px_20px_rgba(11,11,13,0.1)] md:w-[63%] ${CARD_WASH}`}>
              <p className="text-xl leading-7.5 font-semibold text-neutral-900 dark:text-neutral-100">Ready to apply?</p>
              <Paragraph>
                Once you’re ready to apply, go to the DMV with proof of identity (birth certificate, passport), your
                Social Security card, and two proofs of residence (utility bill, bank statement). If under 18, you must
                have signed consent from a parent, legal guardian, or adult spouse. Submit the documents, pass a vision
                screening, pay the fee, and pass the official written test.
              </Paragraph>
              {handbook && (
                <a
                  href={`/handbook/${handbook.id}`}
                  className="inline-flex items-center gap-1 text-lg leading-7 font-medium text-blue-500"
                >
                  Read more <ArrowRight className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* 399px wide, matching the phone's frame in Figma. The artwork is cut out of the flat
            background Figma bakes into its exports, so it never covers the copy beside it. */}
        <div className="w-full max-w-105 shrink-0 xl:relative xl:h-153.25 xl:w-99.75 xl:max-w-none">
          {/* Plain <img>: the cut-out has an alpha channel, and next/image's optimiser will
              re-encode it to JPEG for clients that don't advertise WebP, which would flatten the
              transparency back onto a solid rectangle.

              The asset carries the mockup's own drop shadow (Figma bakes it into the artwork
              rather than applying a layer effect), so it is wider and taller than the handset
              itself. On wide screens it's taken out of flow inside the frame's 399x613 box and
              nudged so the *handset* measures 399px and lands where Figma puts it, leaving the
              shadow free to spill past the column without stretching the section. Narrower
              screens just fit the whole plate to the column. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/test-slug/dmv-checklist-phone-v5.webp"
            alt={`What to bring to the ${selectedState} DMV`}
            width={917}
            height={1349}
            className="w-full max-w-none xl:absolute xl:-top-1.75 xl:-left-8 xl:w-115.75"
          />
        </div>
      </div>
    </section>
  );
}
