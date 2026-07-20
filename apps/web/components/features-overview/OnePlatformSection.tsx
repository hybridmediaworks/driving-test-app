import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { Circle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
    description:
      "We tell you when you're test-ready — and we don't say it early.",
  },
];

const timelineSteps = [
  { label: "AI Tutor", number: 1 },
  { label: "Mock Exams", number: 2 },
  { label: "Simulations", number: 3 },
  { label: "Voice", number: 4 },
  { label: "Progress", number: 5 },
  { label: "Flashcards", number: 6 },
  { label: "Video", number: 7 },
] as const;

export default function OnePlatformSection() {
  return (
    <section className="px-5 py-10 lg:py-30 ">
      <div className="mx-auto max-w-282 md:space-y-15 space-y-8">
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
        <div className="lg:px-12.5 px-5 sm:px-8 md:py-15 py-6 space-y-10 border rounded-xl bg-white shadow-[0_4px_6px_-2px_rgba(0,0,0,0.03),0_12px_16px_-4px_rgba(0,0,0,0.08)]">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:gap-10">
            {highlights.map((item) => (
              <div key={item.title} className="space-y-1.5">
                <Paragraph size="2xl" className="font-semibold" color="dark">
                  {item.title}
                </Paragraph>
                <Paragraph size="sm">{item.description}</Paragraph>
              </div>
            ))}
          </div>

          <Separator />

          <div className="mb-0">
            <div className="grid md:grid-cols-7 grid-cols-1">
              {timelineSteps.map((step) => (
                <div
                  key={step.label}
                  className="flex md:flex-col even:md:flex-col even:flex-row-reverse relative justify-end even:box-content gap-2 md:gap-0 items-center md:border-none md:w-full w-1/2 odd:border-r even:border-l even:ms-auto border-dashed border-blue-300"
                >
                  <Paragraph
                    size="sm"
                    color="muted"
                    className="md:text-center md:pb-1"
                  >
                    {step.label}
                  </Paragraph>
                  <Paragraph
                    size="xs"
                    color="primary"
                    className="font-bold min-w-7 h-7 flex items-center justify-center rounded-full border-2 border-blue-500"
                  >
                    {step.number}
                  </Paragraph>

                  <div className="border-t md:border-l border-dashed border-blue-300 md:min-w-px min-w-8 md:h-8.5 h-px" />
                </div>
              ))}
            </div>
            <div className="bg-blue-300 w-px md:w-full h-auto md:h-px" />
          </div>
          <div className="flex items-center justify-center flex-col -mt-1.5">
            <Circle className="w-3 h-3 fill-blue-500 text-blue-500 z-10" />
            <div className=" h-6 w-px bg-blue-500" />
            <div className="flex items-center gap-2 rounded-lg bg-[#0D142C] px-4 py-2.5 text-white">
              <Paragraph size="sm" color="white" className="font-medium">
                Readiness
              </Paragraph>
              <span className="flex items-center gap-1 text-base font-semibold">
                84% <span className="text-blue-400">▲</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
