"use client";

import { ShieldCheck } from "lucide-react";
import type { PublicQuiz } from "@driving-test-app/shared";
import ChallangeBankBanner from "@/components/cdl/ChallangeBankBanner";
import CheatSheetsBanner from "@/components/cdl/CheatSheetsBanner";
import PremiumBanner from "@/components/cdl/PremiumBanner";
import { useStateQuizzes } from "@/hooks/use-state-quizzes";
import StepsFlow from "./StepsFlow";
import StepsHeader from "./StepsHeader";

type Step = {
  title: string;
  questions: number;
  type: "free" | "premium";
  locked?: boolean;
  image?: string;
};

function toSteps(quizzes: PublicQuiz[]): Step[] {
  return quizzes.map((quiz) => ({
    title: quiz.title,
    questions: quiz.total_questions,
    type: quiz.is_premium ? "premium" : "free",
    locked: quiz.is_premium,
    image: quiz.cover_image_url ?? "/driving-tests.jpg",
  }));
}

function totalQuestionsLabel(quizzes: PublicQuiz[]): string | undefined {
  if (quizzes.length === 0) return undefined;
  return String(quizzes.reduce((sum, quiz) => sum + quiz.total_questions, 0));
}

export default function DrivingTests({
  stateCode = "OR",
  stateName = "Oregon",
  vehicleType = "Car",
  testTrack = "permit_test",
}: {
  stateCode?: string;
  stateName?: string;
  vehicleType?: string;
  testTrack?: string;
}) {
  const { sections, examSimulatorQuizzes, loading } = useStateQuizzes({
    stateCode,
    vehicleType,
    testTrack,
  });

  const [essentials, moreComplicated, thingsInTrouble, extraSupport] = sections;

  const premiumBannerInfo = [
    {
      title: `${stateName} students who use Premium pass 97% of the time`,
      subtitle: "Same format, same difficulty, same tricky answers.",
      features: ["500+ questions", "Exam simulator", "Pass guarantee"],
      rating: { star: "4.7", students: "16,700" },
    },
    {
      title: "Don't walk into the DMV hoping you'll pass",
      subtitle: "The exam simulator mirrors your real test.",
      features: ["Exam simulator", "Challenge Bank™", "Pass guarantee"],
      rating: { star: "4.7", students: "16,700" },
    },
  ];

  return (
    <section className="my-10 space-y-10">
      {essentials && (
        <div>
          <StepsHeader
            headerInfo={{
              headerSequence: "1",
              headerTitle: essentials.category.title,
              headerDesc: essentials.category.description ?? undefined,
              totalQuestions: totalQuestionsLabel(essentials.quizzes),
            }}
          />
          {essentials.quizzes.length > 0 ? (
            <StepsFlow steps={toSteps(essentials.quizzes)} />
          ) : (
            !loading && (
              <p className="mb-12 text-sm text-gray-500">
                {essentials.category.title} practice for {stateName} is coming soon.
              </p>
            )
          )}
          <PremiumBanner premiumInfo={premiumBannerInfo[0]} />
        </div>
      )}

      {moreComplicated && (
        <div>
          <StepsHeader
            headerInfo={{
              headerSequence: "2",
              headerTitle: moreComplicated.category.title,
              headerDesc: moreComplicated.category.description ?? undefined,
              totalQuestions: totalQuestionsLabel(moreComplicated.quizzes),
            }}
          />
          {moreComplicated.quizzes.length > 0 ? (
            <StepsFlow steps={toSteps(moreComplicated.quizzes)} />
          ) : (
            !loading && (
              <p className="mb-12 text-sm text-gray-500">
                {moreComplicated.category.title} practice for {stateName} is coming soon.
              </p>
            )
          )}
        </div>
      )}

      {thingsInTrouble && (
        <div>
          <StepsHeader
            headerInfo={{
              headerSequence: "3",
              headerTitle: thingsInTrouble.category.title,
              headerDesc: thingsInTrouble.category.description ?? undefined,
              totalQuestions: totalQuestionsLabel(thingsInTrouble.quizzes),
            }}
          />
          {thingsInTrouble.quizzes.length > 0 ? (
            <StepsFlow steps={toSteps(thingsInTrouble.quizzes)} />
          ) : (
            !loading && (
              <p className="mb-12 text-sm text-gray-500">
                {thingsInTrouble.category.title} practice for {stateName} is coming soon.
              </p>
            )
          )}
          <PremiumBanner premiumInfo={premiumBannerInfo[1]} />
        </div>
      )}

      <div>
        <StepsHeader
          headerInfo={{
            headerSequence: "4",
            headerTitle: "The exam simulator",
            headerDesc: "Includes random questions from all topics.",
          }}
        />
        {examSimulatorQuizzes.length > 0 ? (
          <StepsFlow steps={toSteps(examSimulatorQuizzes)} />
        ) : (
          !loading && (
            <p className="mb-12 text-sm text-gray-500">
              The {stateName} exam simulator is coming soon.
            </p>
          )
        )}
      </div>

      {extraSupport && (
        <div>
          <StepsHeader
            headerInfo={{
              headerSequence: "5",
              headerTitle: extraSupport.category.title,
              headerDesc: extraSupport.category.description ?? undefined,
              totalQuestions: totalQuestionsLabel(extraSupport.quizzes),
            }}
          />
          {extraSupport.quizzes.length > 0 ? (
            <StepsFlow steps={toSteps(extraSupport.quizzes)} />
          ) : (
            !loading && (
              <p className="mb-12 text-sm text-gray-500">
                {extraSupport.category.title} for {stateName} is coming soon.
              </p>
            )
          )}
        </div>
      )}

      <div>
        <StepsHeader headerInfo={{ headerSequence: "6", headerTitle: "The Challenge Bank™" }} />
        <ChallangeBankBanner />
      </div>

      <div>
        <StepsHeader headerInfo={{ headerSequence: "7", headerTitle: `Explore ${stateCode} Driver's Handbook` }} />
        <CheatSheetsBanner stateCode={stateCode} vehicleType={vehicleType} />
      </div>

      <div>
        <StepsHeader
          headerInfo={{
            headerSequence: "8",
            headerTitle: "More ways to prepare",
            headerDesc: "Tools and guides to help you get your license.",
          }}
        />
        <StepsFlow
          steps={[
            { title: "Video Lessons", questions: 0, type: "free", image: "/driving-tests.jpg" },
            { title: "Tips & Tricks", questions: 0, type: "free", image: "/driving-tests.jpg" },
          ]}
        />
      </div>

      <div className="text-center">
        <button className="rounded-lg bg-[#9747ff]/30 px-4 py-2 text-center text-xl font-semibold text-white">
          End of theory exam preparation
        </button>
        <h3 className="mt-4 text-2xl font-bold">Pass official DMV written exam</h3>
        <p className="mx-auto mt-4 max-w-2xl text-grey">
          Once you reach this place with 80% <b className="text-blue-primary">Passing Probability</b>, you will be
          ready to pass the official DMV written exam with ease and confidence.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-start gap-4 rounded-[20px] bg-[#f2f7ff] p-4">
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/reviewedby_steven.webp" alt="" className="h-auto" />
            <div className="absolute top-2/3 right-0 flex size-8 items-center justify-center rounded-full bg-green-400 text-white">
              <ShieldCheck className="h-4" />
            </div>
          </div>

          <div>
            <h4 className="text-base font-bold">Reviewed for legal and handbook accuracy</h4>
            <h5 className="text-sm font-bold text-blue-primary decoration-1 underline-offset-4 hover:underline">
              Steven Litvintchouk
            </h5>
            <p className="text-sm text-grey">M.S., Chief Educational Researcher (ACES member) Last verified for accuracy on Mar 23, 2026</p>
          </div>
        </div>
        <div className="flex items-start gap-4 rounded-[20px] bg-[#f2f7ff] p-4">
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/reviewedby_steven.webp" alt="" className="h-auto" />
            <div className="absolute top-2/3 right-0 flex size-8 items-center justify-center rounded-full bg-green-400 text-white">
              <ShieldCheck className="h-4" />
            </div>
          </div>

          <div>
            <h4 className="text-base font-bold lg:whitespace-nowrap">Test design and learning experience oversight</h4>
            <h5 className="text-sm font-bold text-blue-primary decoration-1 underline-offset-4 hover:underline">
              Andrei Zakhareuski
            </h5>
            <p className="text-sm text-grey">Co-founder &amp; CEO, Driving-Tests.org</p>
          </div>
        </div>
      </div>
      <p className="text-sm">
        Questions are created and maintained by the Driving-Tests.org content team following our{" "}
        <span className="text-blue-primary decoration-1 underline-offset-4 hover:underline">multi-layer editorial process</span> and
        updated whenever the {stateName} DMV changes its handbook or website information. Official sources we check:{" "}
        <span className="text-blue-primary decoration-1 underline-offset-4 hover:underline">{stateName} Driver Handbook (2026 edition)</span>,{" "}
        <span className="text-blue-primary decoration-1 underline-offset-4 hover:underline">{stateName} DMV website.</span>
      </p>
    </section>
  );
}
