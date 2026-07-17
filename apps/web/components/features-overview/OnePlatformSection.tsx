import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { cn } from "@/lib/utils";

const highlights = [
  {
    title: "Everything scores",
    description:
      "A flashcard flip counts the same as a mock-exam answer. No progress gets stranded in one tool.",
  },
  {
    title: "One weak-topics list",
    description:
      "Right-of-way keeps costing you points? Every tool starts serving right-of-way until it doesn't.",
  },
  {
    title: "One finish line",
    description: "We tell you when you're test-ready — and we don't say it early.",
  },
];

const timelineSteps = [
  { label: "AI Tutor", number: 1 },
  { label: "Mock Exams", number: 2 },
  { label: "Simulations", number: 3 },
  { label: "Voice", number: 4, active: true },
  { label: "Progress", number: 5 },
  { label: "Flashcards", number: 6 },
  { label: "Video", number: 7 },
] as const;

export default function OnePlatformSection() {
  return (
    <section className="px-5 py-10  lg:py-30 ">
      <div className="mx-auto max-w-container space-y-15">
        <div className="flex max-w-162.25 mx-auto flex-col items-center gap-4 text-center">
          <Paragraph
            className="mb-2 border-b border-blue-50 px-3.5 py-1.25 font-bold tracking-[1.2px] uppercase max-w-fit"
            size="xs"
            color="primary"
          >
            ✦ one platform
          </Paragraph>
          <Heading as="h2">Seven tools, one thread</Heading>
          <Paragraph>
            They aren't seven apps. Every answer you give — spoken, tapped or
            flipped —updates the same readiness score, and the score decides
            what you study next.
          </Paragraph>
        </div>
        <div className="px-12.5 py-15 space-y-10 border rounded-xl bg-white shadow-[0_4px_6px_-2px_rgba(0,0,0,0.03),0_12px_16px_-4px_rgba(0,0,0,0.08)]">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-10">
            {highlights.map((item) => (
              <div key={item.title} className="space-y-1.5">
                <Paragraph size="lg" className="font-semibold" color="dark">
                  {item.title}
                </Paragraph>
                <Paragraph>{item.description}</Paragraph>
              </div>
            ))}
          </div>

          <div className="h-px w-full bg-[#E7E6E1]" />

          <div>
            <div className="grid grid-cols-7">
              {timelineSteps.map((step) => (
                <div key={step.label} className="flex flex-col items-center gap-2">
                  <Paragraph size="xs" color="muted" className="text-center">
                    {step.label}
                  </Paragraph>
                  <div
                    className={cn(
                      "w-px border-l border-dashed",
                      step.active ? "h-8 border-blue-500" : "h-6 border-blue-200",
                    )}
                  />
                </div>
              ))}
            </div>

            <div className="relative h-8">
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-blue-200" />
              <div className="relative z-10 grid h-full grid-cols-7">
                {timelineSteps.map((step) => (
                  <div key={step.label} className="flex items-center justify-center">
                    {step.active ? (
                      <span className="h-3 w-3 rounded-full bg-blue-600" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-white text-xs font-semibold text-blue-600">
                        {step.number}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-7">
              {timelineSteps.map((step) => (
                <div key={step.label} className="flex justify-center">
                  {step.active && (
                    <div className="flex flex-col items-center gap-3 pt-2">
                      <div className="h-6 w-px bg-blue-500" />
                      <div className="flex items-center gap-2 rounded-lg bg-[#0D142C] px-4 py-2.5 text-white">
                        <Paragraph size="sm" color="white" className="font-medium">
                          Readiness
                        </Paragraph>
                        <span className="flex items-center gap-1 text-base font-semibold">
                          84% <span className="text-blue-400">▲</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
