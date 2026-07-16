import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { Separator } from "@/components/ui/separator";
import { Check, Clock } from "lucide-react";

type StepCard = {
  number: string;
  title: string;
  description: string;
  duration: string;
  bullets: string[];
  imageLabel: string;
  imageCaption: string;
};

const stepCards: StepCard[] = [
  {
    number: "01",
    title: "Tell us where you're testing",
    description:
      "Pick your state and your test — car permit, CDL, or motorcycle. We load that state's real question pool and rules. Two minutes, no card.",
    duration: "About 2 minutes",
    bullets: [
      "Your state's current handbook and question pool load automatically.",
      "A 15-question diagnostic finds what you already know.",
      "You get a study plan dated to your test day.",
    ],
    imageLabel: "[IMAGE] Onboarding — state & test picker",
    imageCaption:
      "640 × 420 · product screenshot, straight-on · state dropdown open on California, test-type cards below · light UI, uncluttered, calm",
  },
  {
    number: "02",
    title: "Practice until it's automatic",
    description:
      "Short adaptive drills that keep serving what you get wrong. When a question stings, the AI tutor explains it in plain English — then quizzes you back on it.",
    duration: "15 min/day · ~9 days",
    bullets: [
      "Weak topics resurface on a spaced schedule until they stick.",
      "Every wrong answer gets a why, not just a red X.",
      "Mock exams run on the real clock, format, and pass mark.",
    ],
    imageLabel: "[IMAGE] Practice runner + AI tutor",
    imageCaption:
      "640 × 420 · product screenshot · road-sign question with AI-tutor explanation panel open · supportive, explanation is the hero",
  },
  {
    number: "03",
    title: "Walk in calm. Walk out licensed.",
    description:
      "Your readiness score tells you the day you're ready — not a hunch. Run the DMV simulation once, book your slot, and take the test you've already taken a dozen times.",
    duration: "Test day",
    bullets: [
      "Green light at 90% readiness across every topic — no earlier.",
      "A test-day checklist: documents, fees, what to expect at the counter.",
      "Need road hours? Book a vetted local instructor in-app.",
    ],
    imageLabel: "[IMAGE] Readiness score — you're ready",
    imageCaption:
      '640 × 420 · product screenshot · 94% readiness ring, per-topic bars green, "book your test" CTA · quiet confidence, blue ring is focal',
  },
];

export default function StepsSection() {
  return (
    <section className="py-15 md:space-y-15 lg:py-30 bg-[#F2F1EC]">
      <div className="mx-auto max-w-container space-y-12 px-5">
        <div className="space-y-4 max-w-167">
          <Paragraph
            className="mb-2 border-b border-blue-50 px-3.5 py-1.25 font-bold tracking-[1.2px] uppercase"
            size="xs"
            color="primary"
          >
            ✦ How it works
          </Paragraph>
          <Heading as="h2">
            What actually happens, day one to test day.
          </Heading>
          <Paragraph>
            Same three steps for every learner, in all 47 states we cover.
            Here's what each one looks like from the inside.
          </Paragraph>
        </div>
        <Separator className="mb-8 hidden lg:block" />
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          {stepCards.map((step) => (
            <div
              key={step.number}
              className="relative rounded-2xl border bg-white p-5 lg:p-8 flex flex-col justify-between gap-14 shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]"
            >
              <div className="hidden lg:flex items-center justify-center absolute left-0 -top-10.75 w-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M10 14C12.2091 14 14 12.2091 14 10C14 7.79086 12.2091 6 10 6C7.79086 6 6 7.79086 6 10C6 12.2091 7.79086 14 10 14Z"
                    fill="#3B82F6"
                  />
                  <path
                    d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
                    stroke="#E7E6E1"
                    stroke-width="1.2"
                  />
                </svg>
              </div>
              <div className="space-y-5">
                <div className="flex h-15 w-15 items-center justify-center rounded-full border shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
                  <Heading size="xs" color="primary">
                    {step.number}
                  </Heading>
                </div>
                <Heading size="sm">{step.title}</Heading>
                <Paragraph>{step.description}</Paragraph>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <Paragraph
                    size="sm"
                    color="primary"
                    className="font-semibold"
                  >
                    {step.duration}
                  </Paragraph>
                </div>
                <div className="space-y-3">
                  {step.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100">
                        <Check className="h-3 w-3 text-blue-600" />
                      </div>
                      <Paragraph size="sm">{bullet}</Paragraph>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-57.5 flex justify-end flex-col rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-6">
                <Paragraph
                  size="xs"
                  color="dark"
                  className="font-semibold whitespace-nowrap bg-white rounded-full border max-w-fit px-3 py-1.5"
                >
                  {step.imageLabel}
                </Paragraph>
                <Paragraph size="xs" color="muted" className="pt-3">
                  {step.imageCaption}
                </Paragraph>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
