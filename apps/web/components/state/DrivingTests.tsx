import { ShieldCheck } from "lucide-react";
import ChallangeBankBanner from "@/components/cdl/ChallangeBankBanner";
import CheatSheetsBanner from "@/components/cdl/CheatSheetsBanner";
import PremiumBanner from "@/components/cdl/PremiumBanner";
import StepsFlow from "./StepsFlow";
import StepsHeader from "./StepsHeader";

const essentialsSteps = [
  { title: "OR DMV Diagnostic Test", questions: 8, type: "free" as const, image: "/driving-tests.jpg" },
  { title: "OR Practice Test 1", questions: 20, type: "free" as const, image: "/driving-tests.jpg", status: "next" as const },
  { title: "OR Practice Test 2", questions: 20, type: "free" as const, image: "/driving-tests.jpg" },
  { title: "OR Practice Test 3", questions: 20, type: "free" as const, image: "/driving-tests.jpg" },
  { title: "OR Practice Test 4", questions: 40, type: "premium" as const, locked: true, image: "/driving-tests.jpg" },
  { title: "OR Practice Test 5", questions: 40, type: "premium" as const, locked: true, image: "/driving-tests.jpg" },
  { title: "OR Practice Test 6", questions: 40, type: "premium" as const, locked: true, image: "/driving-tests.jpg" },
];

const sections = [
  {
    header: {
      headerSequence: "1",
      headerTitle: "The Essentials",
      headerDesc: "Your journey begins here. These tests cover key concepts and essential knowledge.",
      totalQuestions: "140",
    },
    steps: essentialsSteps,
  },
  {
    header: {
      headerSequence: "2",
      headerTitle: "The more complicated stuff",
      headerDesc: "Master complex driving scenarios and tricky road signs.",
      totalQuestions: "325",
    },
    steps: [
      { title: "Intersections", questions: 25, type: "free" as const, image: "/driving-tests.jpg" },
      { title: "Right of Way", questions: 30, type: "free" as const, status: "next" as const, image: "/driving-tests.jpg" },
      { title: "Lane Rules", questions: 25, type: "free" as const, image: "/driving-tests.jpg" },
      { title: "Advanced Signs", questions: 40, type: "premium" as const, locked: true, image: "/driving-tests.jpg" },
    ],
  },
  {
    header: {
      headerSequence: "3",
      headerTitle: "The things that could get you in trouble",
      headerDesc: "Avoid fines and penalties by mastering critical rules.",
      totalQuestions: "93",
    },
    steps: [
      { title: "Traffic Violations", questions: 20, type: "free" as const, image: "/driving-tests.jpg" },
      { title: "Speed Limits", questions: 25, type: "free" as const, status: "next" as const, image: "/driving-tests.jpg" },
      { title: "DUI Laws", questions: 30, type: "premium" as const, locked: true, image: "/driving-tests.jpg" },
    ],
  },
  {
    header: { headerSequence: "4", headerTitle: "The exam simulator", headerDesc: "Includes random questions from all topics." },
    steps: [{ title: "Simulator 1", questions: 35, type: "premium" as const, locked: true, image: "/driving-tests.jpg" }],
  },
  {
    header: { headerSequence: "5", headerTitle: "The extra support", headerDesc: "Downloadable guides to keep your knowledge fresh." },
    steps: [
      { title: "Simulator 1", questions: 35, type: "premium" as const, locked: true, image: "/driving-tests.jpg" },
      { title: "Simulator 2", questions: 35, type: "premium" as const, locked: true, image: "/driving-tests.jpg" },
    ],
  },
  { header: { headerSequence: "6", headerTitle: "The Challenge Bank™" }, steps: undefined },
  { header: { headerSequence: "7", headerTitle: "Explore OR Driver's Handbook" }, steps: undefined },
  {
    header: { headerSequence: "8", headerTitle: "More ways to prepare", headerDesc: "Tools and guides to help you get your license." },
    steps: [
      { title: "Video Lessons", questions: 0, type: "free" as const, image: "/driving-tests.jpg" },
      { title: "Tips & Tricks", questions: 0, type: "free" as const, image: "/driving-tests.jpg" },
    ],
  },
];

const premiumBannerInfo = [
  {
    title: "Oregon students who use Premium pass 97% of the time",
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

export default function DrivingTests() {
  return (
    <section className="my-10 space-y-10">
      {sections.map((section, index) => (
        <div key={index}>
          <StepsHeader headerInfo={section.header} />
          <StepsFlow steps={section.steps} />
          {index === 0 && <PremiumBanner premiumInfo={premiumBannerInfo[0]} />}
          {index === 2 && <PremiumBanner premiumInfo={premiumBannerInfo[1]} />}
          {index === 5 && <ChallangeBankBanner />}
          {index === 6 && <CheatSheetsBanner />}
        </div>
      ))}

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
        updated whenever the Oregon DMV changes its handbook or website information. Official sources we check:{" "}
        <span className="text-blue-primary decoration-1 underline-offset-4 hover:underline">Oregon Driver Handbook (2026 edition)</span>,{" "}
        <span className="text-blue-primary decoration-1 underline-offset-4 hover:underline">Oregon DMV website.</span>
      </p>
    </section>
  );
}
