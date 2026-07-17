import {
  ArrowRight,
  BrainCircuit,
  CarFront,
  ChartColumn,
  Copy,
  Mic,
  NotepadText,
  TvMinimalPlay,
} from "lucide-react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import Button from "@/components/ui/Button";

export default function TheToolkitSection() {
  return (
    <section
      className="bg-auto bg-top-right bg-no-repeat px-5 py-10  lg:py-30 bg-[#F2F1EC]"
      style={{ backgroundImage: "url('/thetoolkit-img.png')" }}
    >
      <div className="mx-auto max-w-container space-y-12">
        <div className="flex max-w-152.25 flex-col gap-4">
          <Paragraph
            className="mb-2 border-b border-blue-50 px-3.5 py-1.25 font-bold tracking-[1.2px] uppercase max-w-fit"
            size="xs"
            color="primary"
          >
            ✦ The toolkit
          </Paragraph>
          <Heading as="h2">Pick the one that fixes your weakest hour</Heading>
          <Paragraph>
            Each tool is built for a different failure point — not knowing the
            rule, not knowing the test, not keeping the habit.
          </Paragraph>
        </div>
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="col-span-2 flex flex-col justify-between gap-6 relative rounded-2xl border bg-[#0D142C] p-5 lg:p-7 shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
              <div className="space-y-6">
                <BrainCircuit className="bg-white/8 p-3.5 rounded-[11px] w-14 h-14 text-blue-300" />
                <Heading as="h3" size="lg" className="mb-2" color="white">
                  AI Tutor
                </Heading>
                <Paragraph className="text-neutral-300! max-w-119">
                  Ask why an answer is wrong and get the rule, the reason, and
                  the exact handbook line it comes from. Available at 2am,
                  unlike your instructor.
                </Paragraph>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Paragraph
                    className="w-[85%] max-w-90 rounded-lg bg-blue-950 border border-blue-900 px-3.5 py-3 text-blue-100!"
                    size="sm"
                  >
                    Why is it 3 seconds, not 2?
                  </Paragraph>
                  <Paragraph
                    size="sm"
                    className="w-[85%] max-w-90 ms-auto rounded-lg bg-blue-700 border border-blue-700 px-3.5 py-3 text-blue-100!"
                  >
                    The 3-second rule gives safe stopping distance at speed. At
                    60 mph you cover ~88 ft/sec — 2 seconds leaves too little
                    margin in the rain.
                  </Paragraph>
                  <Paragraph
                    className="w-[85%] max-w-90 rounded-lg bg-blue-950 border border-blue-900 px-3.5 py-3 text-blue-100!"
                    size="sm"
                  >
                    Yes, 10 questions.
                  </Paragraph>
                </div>
                <Button variant="ghost" className="p-0!">
                  Explore AI Tutor <ArrowRight className="w-5" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-6 relative rounded-2xl border bg-white p-5 lg:p-7 shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
              <div className="space-y-6">
                <NotepadText className="bg-blue-100 p-3.5 rounded-[11px] w-14 h-14 text-blue-500" />
                <Heading as="h3" size="sm" className="mb-2">
                  Mock Exams
                </Heading>
                <Paragraph className="max-w-119">
                  The real thing: same question count, same pass mark, same
                  clock. Score it, then see every miss explained.
                </Paragraph>
              </div>
              <div className="space-y-6">
                <div className="space-y-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="flex gap-2 items-center justify-between">
                    <Paragraph size="xs" className="font-bold">
                      QUESTION 18 / 46
                    </Paragraph>
                    <Paragraph size="sm" className="font-bold" color="dark">
                      12:04 left
                    </Paragraph>
                  </div>
                  <div className="rounded-full h-2 overflow-hidden bg-blue-200 relative">
                    <div className="rounded-full bg-linear-to-r from-blue-600 to-blue-500 absolute left-0 top-0 h-full w-[85%]"></div>
                  </div>
                  <Paragraph className="font-bold">
                    A solid yellow line on your side means you may:
                  </Paragraph>
                  <div className="border border-blue-800 rounded-lg px-3 py-2 flex items-center gap-2">
                    <div className="min-w-3 h-3 rounded-full border border-blue-700" />
                    <Paragraph size="xs">Pass when the road is clear</Paragraph>
                  </div>
                  <div className="border bg-blue-500 border-blue-800 rounded-lg px-3 py-2 flex items-center gap-2">
                    <div className="min-w-3 h-3 rounded-full border border-blue-400 bg-blue-700" />
                    <Paragraph size="xs" className="font-bold" color="white">
                      Pass when the road is clear
                    </Paragraph>
                  </div>
                </div>
                <Button variant="ghost" className="p-0!">
                  Explore Mock Exams <ArrowRight className="w-5" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-6 relative rounded-2xl border bg-white p-5 lg:p-7 shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
              <div className="space-y-6">
                <CarFront className="bg-blue-100 p-3.5 rounded-[11px] w-14 h-14 text-blue-500" />
                <Heading as="h3" size="sm" className="mb-2">
                  DMV Simulations
                </Heading>
                <Paragraph className="max-w-119">
                  Walk the counter, the eye chart, the road test route — before
                  you walk them for real.
                </Paragraph>
              </div>
              <div className="space-y-6">
                <div className="space-y-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="flex gap-2 items-center justify-between">
                    <Paragraph size="xs" className="font-bold">
                      ROAD TEST · STEP 4
                    </Paragraph>
                    <Paragraph size="sm" className="font-bold" color="dark">
                      Four-way stop
                    </Paragraph>
                  </div>
                  <img src="dmv-simulations.svg" alt="" />
                </div>
                <Button variant="ghost" className="p-0!">
                  Explore Simulations <ArrowRight className="w-5" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-6 relative rounded-2xl border bg-white p-5 lg:p-7 shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
              <div className="space-y-6">
                <Mic className="bg-blue-100 p-3.5 rounded-[11px] w-14 h-14 text-blue-500" />
                <Heading as="h3" size="sm" className="mb-2">
                  Voice Learning
                </Heading>
                <Paragraph className="max-w-119">
                  Study with your eyes on the road. Questions read aloud,
                  answers spoken back, hands free.
                </Paragraph>
              </div>
              <div className="space-y-6">
                <div className="space-y-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="flex gap-2 items-center justify-between">
                    <Paragraph size="xs" className="font-bold">
                      SESSION · COMMUTE
                    </Paragraph>
                    <Paragraph size="sm" className="font-bold" color="dark">
                      14:22
                    </Paragraph>
                  </div>
                  <img src="sound-wave.svg" alt="" />
                </div>
                <Button variant="ghost" className="p-0!">
                  Explore Voice Learning <ArrowRight className="w-5" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-6 relative rounded-2xl border bg-white p-5 lg:p-7 shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
              <div className="space-y-6">
                <ChartColumn className="bg-blue-100 p-3.5 rounded-[11px] w-14 h-14 text-blue-500" />
                <Heading as="h3" size="sm" className="mb-2">
                  Progress Tracking
                </Heading>
                <Paragraph className="max-w-119">
                  A readiness score you can trust, plus the five topics standing
                  between you and it.
                </Paragraph>
              </div>
              <div className="space-y-6">
                <div className="space-y-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="flex gap-2 items-center justify-between">
                    <Paragraph size="xs" className="font-bold">
                      READINESS
                    </Paragraph>
                    <Paragraph size="sm" className="font-bold" color="dark">
                      84% · test-ready
                    </Paragraph>
                  </div>
                  <div className="rounded-full h-2 overflow-hidden bg-blue-200 relative">
                    <div className="rounded-full bg-linear-to-r from-blue-600 to-blue-500 absolute left-0 top-0 h-full w-[85%]"></div>
                  </div>
                  <img src="progress-tracking.svg" alt="" />
                </div>
                <Button variant="ghost" className="p-0!">
                  Explore Progress <ArrowRight className="w-5" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-6 relative rounded-2xl border bg-white p-5 lg:p-7 shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
              <div className="space-y-6">
                <Copy className="bg-blue-100 p-3.5 rounded-[11px] w-14 h-14 text-blue-500" />
                <Heading as="h3" size="sm" className="mb-2">
                  Flashcards
                </Heading>
                <Paragraph className="max-w-119">
                  Signs, penalties, limits. Spaced repetition puts the ones you
                  keep missing back in front of you.
                </Paragraph>
              </div>
              <div className="space-y-6">
                <div className="space-y-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="flex gap-2 items-center justify-between">
                    <Paragraph size="xs" className="font-bold">
                      DECK · ROAD SIGNS
                    </Paragraph>
                    <Paragraph size="sm" className="font-bold" color="dark">
                      32 due
                    </Paragraph>
                  </div>
                  <div className="rounded-full h-2 overflow-hidden bg-blue-200 relative">
                    <div className="rounded-full bg-linear-to-r from-blue-600 to-blue-500 absolute left-0 top-0 h-full w-[85%]"></div>
                  </div>
                  <img src="flashcards.svg" alt="" />
                </div>
                <Button variant="ghost" className="p-0!">
                  Explore Flashcards <ArrowRight className="w-5" />
                </Button>
              </div>
            </div>
            <div className="col-span-2 flex flex-col justify-between gap-6 relative rounded-2xl border bg-[#0D142C] p-5 lg:p-7 shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
              <div className="space-y-6">
                <TvMinimalPlay className="bg-white/8 p-3.5 rounded-[11px] w-14 h-14 text-blue-300" />
                <Heading as="h3" size="lg" className="mb-2" color="white">
                  Video Lessons
                </Heading>
                <Paragraph className="text-neutral-300! max-w-138.25">
                  Three-minute lessons that show the manoeuvre instead of
                  describing it — parallel parking, freeway merges, four-way
                  stops. Watch it, then answer on it.
                </Paragraph>
              </div>
              <div className="space-y-6">
                <div className="space-y-3 p-4 rounded-xl bg-blue-950 border border-blue-800">
                  <div className="flex gap-2 items-center justify-between">
                    <Paragraph size="xs" className="font-bold" color="white">
                      COURSE · CAR / PERMIT
                    </Paragraph>
                    <Paragraph size="sm" className="font-bold" color="white">
                      Lesson 6 of 24
                    </Paragraph>
                  </div>
                  <div className="rounded-full h-2 overflow-hidden bg-blue-800 relative">
                    <div className="rounded-full bg-linear-to-r from-blue-600 to-blue-500 absolute left-0 top-0 h-full w-[85%]"></div>
                  </div>
                  <div className="flex gap-3">
                    <Paragraph
                      size="xs"
                      className="w-full p-3.5 flex flex-col justify-center border border-dashed border-blue-200 rounded-xl text-neutral-100!"
                    >
                      <strong className="text-blue-300">
                        [IMAGE] Parallel parking, shot from above
                      </strong>
                      1180 × 180 · tight on car and gap · daylight, natural,
                      unstaged
                    </Paragraph>
                    <div className="w-full max-w-50 space-y-3">
                      <div className="border bg-blue-800 border-blue-400 rounded-lg px-3 py-2 flex items-center gap-2">
                        <div className="min-w-3 h-3 rounded-full border border-blue-400 bg-blue-400" />
                        <Paragraph
                          size="xs"
                          className="font-bold"
                          color="white"
                        >
                          01 · Find the gap
                        </Paragraph>
                      </div>
                      <div className="border border-blue-800 rounded-lg px-3 py-2 flex items-center gap-2">
                        <div className="min-w-3 h-3 rounded-full border border-blue-700" />
                        <Paragraph size="xs" color="white">
                          02 · Set the reference
                        </Paragraph>
                      </div>
                      <div className="border border-blue-800 rounded-lg px-3 py-2 flex items-center gap-2">
                        <div className="min-w-3 h-3 rounded-full border border-blue-700" />
                        <Paragraph size="xs" color="white">
                          03 · Straighten out
                        </Paragraph>
                      </div>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" className="p-0!">
                  Explore Video Lessons <ArrowRight className="w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
