import {
  ArrowRight,
  Bookmark,
  BotMessageSquare,
  Check,
  Settings2,
  X,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";

/** Soft two-step shadow shared by every light bento card (Figma Shadow xs + sm). */
const CARD_SHADOW =
  "shadow-[0px_1px_2px_0px_rgba(14,17,22,0.06),0px_2px_6px_0px_rgba(14,17,22,0.05)]";

export default function FeaturesSection() {
  return (
    <section className="bg-background px-5 py-16 lg:py-24">
      <div className="mx-auto max-w-container">
        {/* Header — headline left, sub-paragraph + CTA stacked on the right */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch lg:justify-between">
          <div className="max-w-[560px] lg:max-w-[720px]">
            <span className="inline-flex items-center gap-2 border-b border-neutral-300 pb-2.5 text-xs font-semibold tracking-[0.16em] text-blue-600 uppercase">
              <span aria-hidden className="text-sm leading-none">
                ✦
              </span>
              Features
            </span>
            {/* Break forced after "for" to match Figma's two-line wrap (node 1659:7439);
                below lg the <br> collapses so the headline wraps naturally on mobile. */}
            <Heading as="h2" className="mt-4">
              Every tool built for
              <br className="hidden lg:block" /> the moment it matters.
            </Heading>
          </div>
          <div className="flex flex-col items-start gap-6 lg:items-end lg:justify-between">
            {/* Left-aligned; break forced after "question" to match Figma's
                two-line wrap (node 1659:7439). Below lg the <br> collapses. */}
            <Paragraph className="max-w-[280px] lg:max-w-[420px]">
              One platform, from your first practice question
              <br className="hidden lg:block" /> to the seat of the
              examiner&rsquo;s car.
            </Paragraph>
            <ExploreButton />
          </div>
        </div>

        {/* Bento grid */}
        <div className="mt-10 space-y-5 lg:mt-[60px]">
          {/* Top row — Figma 785 / 555 split with a 20px gutter */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[785fr_555fr] lg:items-stretch">
            <AiTutorCard />
            <MockExamsCard />
          </div>

          {/* Bottom row — three equal stat cards */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <StatCard
              graphic={<ProgressRing />}
              title="Progress Tracking"
              body="A readiness score that tells you exactly when to book the test."
              borderClass="border-green-200"
              tint="radial-gradient(115% 100% at 4% 4%, rgba(220,252,231,0.9), rgba(255,255,255,0) 62%)"
              dotClass="bg-green-500"
              labelClass="text-green-500"
              label="On track to pass"
            />
            <StatCard
              graphic={
                <span className="flex size-[60px] items-center justify-center rounded-[16px] bg-yellow-50">
                  <Waveform6 className="w-9" />
                </span>
              }
              title="Voice Learning"
              body="Study hands-free, on the move — answer aloud on your commute."
              borderClass="border-background3"
              tint="radial-gradient(115% 100% at 4% 4%, rgba(254,249,195,0.75), rgba(255,255,255,0) 62%)"
              dotClass="bg-yellow-500"
              labelClass="text-yellow-500"
              label="12 min avg session"
            />
            <StatCard
              graphic={
                <span className="flex size-[60px] items-center justify-center rounded-[16px] bg-red-50">
                  <FlashcardsIcon className="size-9" />
                </span>
              }
              title="Flashcards"
              body="Spaced repetition that locks signs and rules into long-term memory."
              borderClass="border-background3"
              tint="radial-gradient(115% 100% at 4% 4%, rgba(254,226,226,0.7), rgba(255,255,255,0) 62%)"
              dotClass="bg-red-500"
              labelClass="text-red-500"
              label="240 cards mastered"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Header CTA — flat royal-blue pill with an inline arrow (no circle), matching */
/* the Figma (node 1659:7439).                                                  */
/* -------------------------------------------------------------------------- */
function ExploreButton() {
  return (
    <Link
      href="/features-overview"
      className="group inline-flex items-center gap-2.5 rounded-full bg-linear-to-b from-[#4361ee] to-[#3a51d8] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_-10px_rgba(58,81,216,0.6)] transition-transform hover:-translate-y-0.5"
    >
      <span className="whitespace-nowrap">Explore All Features</span>
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* AI Driving Tutor — dark navy card with a chat mockup                         */
/* -------------------------------------------------------------------------- */
function AiTutorCard() {
  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-[24px] border border-blue-900 p-[33px] shadow-[0px_24px_60px_0px_rgba(14,17,22,0.16)] transition-[transform,border-color,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:border-green-800/60 hover:shadow-[0px_24px_70px_0px_rgba(34,197,94,0.16)] lg:min-h-[512px]"
      style={{
        backgroundImage:
          "linear-gradient(-25.12deg, #172554 14.5%, #0d142c 85.5%)",
      }}
    >
      {/* Left-mid glow — a warm amber bloom by default that crossfades to green
          on hover (both anchored to the left-center edge). */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 -left-40 h-[460px] w-72 -translate-y-1/2 rounded-full opacity-70 blur-[90px] transition-opacity duration-500 group-hover:opacity-0"
        style={{
          background:
            "radial-gradient(circle, #eab308 0%, rgba(234,179,8,0.35) 45%, rgba(234,179,8,0) 72%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 -left-40 h-[460px] w-72 -translate-y-1/2 rounded-full opacity-0 blur-[90px] transition-opacity duration-500 group-hover:opacity-90"
        style={{
          background:
            "radial-gradient(circle, #22c55e 0%, rgba(34,197,94,0.35) 45%, rgba(34,197,94,0) 72%)",
        }}
      />

      {/* Header */}
      <div className="relative flex items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-[12px] bg-blue-900 text-white">
          <BotMessageSquare className="size-9" />
        </span>
        <Heading as="h3" color="white" className="lg:leading-14">
          AI Driving Tutor
        </Heading>
      </div>
      <p className="relative mt-3 pl-[72px] text-base leading-6 text-neutral-300">
        Ask anything. Get explained answers, weak-spot drills, and a study plan
        that adapts after every question.
      </p>

      {/* Chat mockup — translucent panel with anchored bubbles */}
      <div className="relative mt-8 h-[293px] w-full overflow-hidden rounded-[16px] bg-white/[0.14]">
        <div className="absolute top-6 right-6 w-[396px] max-w-[75%] rounded-[12px] rounded-br-[4px] bg-blue-700/50 px-3 py-[9px]">
          <p className="text-[18px] leading-7 whitespace-nowrap text-neutral-50">
            Why is it 3 seconds, not 2?
          </p>
        </div>
        <div className="absolute top-[86px] left-6 max-w-[396px] rounded-[12px] rounded-bl-[4px] bg-blue-900/50 px-3 py-[9px]">
          <p className="text-[18px] leading-7 text-neutral-200">
            The 3-second rule gives safe stopping distance at speed. At 60 mph
            you cover ~88 ft/sec — 2 seconds leaves too little margin in the
            rain.
          </p>
        </div>
        <div className="absolute top-[232px] left-6 flex items-center gap-1 rounded-[12px] rounded-bl-[4px] bg-blue-900 px-[13px] py-[11px]">
          {/* Live "typing" indicator — dots bounce in sequence. */}
          <style>{`@keyframes aiTypeDot{0%,72%,100%{transform:translateY(0);opacity:.45}36%{transform:translateY(-4px);opacity:1}}`}</style>
          {[0, 1, 2].map((d) => (
            <span
              key={d}
              className="size-1.5 rounded-[3px] bg-blue-300"
              style={{
                animation: `aiTypeDot 1.1s ease-in-out ${(d * 0.18).toFixed(2)}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Mock Exams — light-blue card with a quiz mockup                              */
/* -------------------------------------------------------------------------- */
function MockExamsCard() {
  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-[24px] border border-blue-200 p-[33px] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-hover lg:min-h-[512px] ${CARD_SHADOW}`}
      style={{
        backgroundImage:
          "radial-gradient(140% 140% at 0% 0%, #ffffff 0%, #dbeafe 88%)",
      }}
    >
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[8px] bg-blue-100 text-blue-700">
          <MockIcon className="w-6" />
        </span>
        <div className="flex flex-col gap-3">
          <Heading as="h3" size="sm">
            Mock Exams
          </Heading>
          <Paragraph size="md" color="muted">
            Real DMV format, real timing, instant scoring.
          </Paragraph>
        </div>
      </div>

      {/* Quiz mockup — the panel is fixed. Rest shows the full quiz (original,
          full-width). On hover it CROSS-FADES to a zoomed copy of the same quiz
          that fills the panel width (no side crop). Two stacked layers animated
          with opacity + a small scale = GPU-smooth, and the rest layout is
          untouched. (A continuous "grow" zoom would force a width animation,
          which is what caused the jank — this dissolve keeps it buttery.) */}
      <div className="mt-6 flex-1">
        <div className="relative flex h-full flex-col overflow-hidden rounded-[16px] border border-blue-200 bg-white p-3.5 shadow-[0px_9px_32px_-12px_rgba(23,37,84,0.35)]">
          {/* Rest — full quiz; fades out. PURE opacity (no scale) = nothing gets
              re-rasterized, so the crossfade is 100% GPU-composited and smooth. */}
          <div className="[will-change:opacity] transition-opacity duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:opacity-0">
            <QuizMock />
          </div>
          {/* Hover — same quiz, statically zoomed to fill the panel; fades in. */}
          <div className="pointer-events-none absolute inset-0 p-3.5 opacity-0 [will-change:opacity] transition-opacity duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:opacity-100">
            <div className="mx-auto w-[74.07%] origin-top scale-[1.35]">
              <QuizMock />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuizMock() {
  return (
    <div className="flex flex-col gap-2">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[8px] font-semibold text-blue-600">
            Road signs
          </span>
          <span className="text-[8px] font-semibold text-neutral-700">
            Questions <span className="font-normal text-neutral-500">12/20</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-neutral-400">
          <Bookmark className="size-3" />
          <Settings2 className="size-3" />
        </div>
      </div>

      <p className="text-[11px] font-semibold text-neutral-900">
        What does this sign mean?
      </p>

      {/* Yellow curve-warning sign in its framed box */}
      <div className="flex items-center justify-center rounded-lg border border-background3 bg-neutral-50 py-3.5">
        <CurveSign className="size-14" />
      </div>

      {/* Answers */}
      <div className="flex flex-col gap-1.5">
        {/* Correct */}
        <div className="flex items-center justify-between gap-2 rounded-lg bg-green-50 px-2 py-1.5">
          <div className="flex items-center gap-2">
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-green-500 text-[8px] font-bold text-neutral-50">
              A
            </span>
            <span className="text-[9px] font-medium text-neutral-900">
              The road ahead curves to the right
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="rounded-full border border-green-400 bg-white px-1.5 py-0.5 text-[7px] font-semibold text-green-700">
              Correct answer
            </span>
            <span
              className="flex size-3.5 items-center justify-center rounded-full bg-green-600 text-white"
              style={{ animation: "mockCheckPop 2.6s ease-in-out infinite" }}
            >
              {/* "Instant scoring" pulse on the correct answer. */}
              <style>{`@keyframes mockCheckPop{0%,70%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(22,163,74,0)}80%{transform:scale(1.18);box-shadow:0 0 0 4px rgba(22,163,74,.25)}90%{transform:scale(1);box-shadow:0 0 0 6px rgba(22,163,74,0)}}`}</style>
              <Check className="size-2.5" strokeWidth={3} />
            </span>
          </div>
        </div>

        <AnswerRow letter="B" label="Right turn only" />
        <AnswerRow letter="C" label="Merging traffic ahead" />

        {/* Wrong pick — highlighted */}
        <div className="rounded-lg border border-red-500 bg-red-50 px-2 py-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-neutral-50">
                D
              </span>
              <span className="text-[9px] font-medium text-red-950">
                No right turn permitted
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="rounded-full border border-red-500 bg-white px-1.5 py-0.5 text-[7px] font-semibold text-red-700">
                Your answer
              </span>
              <span className="flex size-3.5 items-center justify-center rounded-full bg-red-600 text-white">
                <X className="size-2.5" strokeWidth={3} />
              </span>
            </div>
          </div>
          <p className="mt-1.5 text-[8px] leading-snug text-neutral-700">
            Yellow diamonds warn, they don&rsquo;t command. This one tells you
            the road bends right just ahead — nothing to do but ease off the gas
            and take the curve at a steady speed.
          </p>
        </div>
      </div>
    </div>
  );
}

function AnswerRow({ letter, label }: { letter: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-background3 bg-white px-2 py-1.5">
      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[8px] font-bold text-neutral-500">
        {letter}
      </span>
      <span className="text-[9px] font-medium text-neutral-700">{label}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Bottom-row stat card                                                         */
/* -------------------------------------------------------------------------- */
function StatCard({
  graphic,
  title,
  body,
  borderClass,
  tint,
  dotClass,
  labelClass,
  label,
}: {
  graphic: ReactNode;
  title: string;
  body: string;
  borderClass: string;
  tint: string;
  dotClass: string;
  labelClass: string;
  label: string;
}) {
  return (
    <div
      className={`relative flex flex-col gap-6 overflow-hidden rounded-[24px] border bg-white p-[25px] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-hover ${borderClass} ${CARD_SHADOW} md:h-[277px]`}
      style={{ backgroundImage: tint }}
    >
      {graphic}
      <div className="flex flex-col gap-4">
        <Heading as="h3" size="xs">
          {title}
        </Heading>
        <div className="flex flex-col gap-3">
          <Paragraph size="md">{body}</Paragraph>
          <div className="flex items-center gap-1.5">
            <span className={`size-3 shrink-0 rounded-full ${dotClass}`} />
            <span className={`text-base leading-6 ${labelClass}`}>{label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Inline SVG icons (exact Figma assets)                                        */
/* -------------------------------------------------------------------------- */
function ProgressRing() {
  return (
    <div className="relative size-[60px]">
      <svg viewBox="0 0 60 60" className="size-[60px]" fill="none" aria-hidden>
        <path
          d="M30 3C33.5457 3 37.0567 3.69838 40.3325 5.05525C43.6082 6.41213 46.5847 8.40094 49.0919 10.9081C51.5991 13.4153 53.5879 16.3918 54.9447 19.6676C56.3016 22.9433 57 26.4543 57 30C57 33.5457 56.3016 37.0567 54.9447 40.3325C53.5879 43.6082 51.5991 46.5847 49.0919 49.0919C46.5847 51.5991 43.6082 53.5879 40.3324 54.9448C37.0567 56.3016 33.5457 57 30 57C26.4543 57 22.9433 56.3016 19.6675 54.9447C16.3917 53.5879 13.4153 51.5991 10.9081 49.0919C8.40093 46.5847 6.41212 43.6082 5.05525 40.3324C3.69837 37.0566 3 33.5457 3 30C3 26.4543 3.69838 22.9433 5.05526 19.6675C6.41214 16.3917 8.40094 13.4153 10.9081 10.9081C13.4153 8.40093 16.3918 6.41212 19.6676 5.05525C22.9434 3.69837 26.4543 3 30 3L30 3Z"
          stroke="#dcfce7"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M30 3C35.3401 3 40.5603 4.58352 45.0004 7.55032C49.4405 10.5171 52.9012 14.7339 54.9447 19.6675C56.9883 24.6012 57.523 30.03 56.4812 35.2674C55.4394 40.5049 52.8679 45.3159 49.0919 49.0919C45.3159 52.8679 40.5049 55.4394 35.2674 56.4812C30.03 57.523 24.6012 56.9883 19.6675 54.9447C14.7339 52.9012 10.5171 49.4405 7.55032 45.0004C4.58352 40.5603 3 35.3401 3 30"
          stroke="#22c55e"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-sora text-[13px] font-extrabold text-green-500">
        80%
      </span>
    </div>
  );
}

function Waveform6({ className }: { className?: string }) {
  const bars = ["M1.8 14.4V19.8", "M9 7.2V27", "M16.2 1.8V34.2", "M23.4 10.8V23.4", "M30.6 5.4V28.8", "M37.8 14.4V19.8"];
  return (
    <svg viewBox="0 0 39.6 36" className={className} fill="none" aria-hidden>
      {bars.map((d) => (
        <path
          key={d}
          d={d}
          stroke="#eab308"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

function FlashcardsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      className={className}
      fill="#ef4444"
      role="img"
      aria-label="Flashcards"
    >
      <path d="M0 7.96779C0.0394585 7.89572 0.0587185 7.7989 0.0728371 7.71871C0.307188 6.38762 1.27163 5.2086 2.54336 4.73797C2.88561 4.6113 3.27078 4.52051 3.63658 4.42165L5.32271 3.96857L10.6562 2.53982L15.2979 1.29587L16.7499 0.905709C17.1628 0.795275 17.5724 0.672924 17.9981 0.625974C18.7114 0.551921 19.4312 0.674186 20.08 0.979555C21.1535 1.48238 21.7978 2.28228 22.194 3.37802C22.3822 3.40604 22.7283 3.39763 22.9296 3.39758L24.155 3.39658L29.6786 3.39675L31.3196 3.39593C31.676 3.39579 32.1186 3.38573 32.4691 3.4265C32.9377 3.48011 33.393 3.61623 33.8142 3.82858C34.7479 4.30194 35.4586 5.12291 35.7933 6.11488C35.8871 6.39782 35.9093 6.71391 36 6.96645V31.5817C35.9445 31.7246 35.9075 32.0087 35.8662 32.1701C35.763 32.5716 35.5885 32.9558 35.3656 33.303C34.7936 34.1886 33.8975 34.8149 32.8693 35.0478C32.2864 35.1743 31.7201 35.1443 31.1268 35.1439L29.3562 35.1434L22.9426 35.1432L18.8399 35.1436L17.6247 35.1445C16.3265 35.1446 15.7929 35.0543 14.6806 34.3366C14.4516 34.374 14.0503 34.492 13.8138 34.5554L12.0371 35.0328C10.8078 35.3626 9.95776 35.6254 8.67913 35.12C7.77468 34.7628 7.03116 34.0887 6.58744 33.2234C6.30854 32.6877 6.04023 31.5174 5.87101 30.8853L4.93221 27.3846L1.09799 13.0736L0.190691 9.70115C0.138154 9.50749 0.0690449 9.03302 0 8.89015V7.96779ZM32.1235 33.7187C32.8693 33.6823 33.4424 33.3976 33.9463 32.8496C34.6521 32.0824 34.5943 31.2646 34.5945 30.3036V28.3892V21.9867L34.5941 12.1814L34.5945 9.03313C34.595 8.46005 34.6003 7.88916 34.5888 7.3152C34.5649 6.10465 33.6544 5.03481 32.452 4.85062C32.1529 4.80559 31.8081 4.81404 31.5014 4.8139L30.388 4.81432L26.5632 4.81468L20.2489 4.81466L18.213 4.81438C17.8346 4.81431 17.3821 4.80355 17.009 4.8239C16.2198 4.8811 15.6772 5.09577 15.139 5.69968C14.4254 6.50051 14.5171 7.37683 14.517 8.36231L14.5169 10.6459L14.5174 18.0587L14.5178 27.0167L14.5172 29.8199C14.5168 30.2646 14.4965 30.947 14.5306 31.3801C14.5872 32.0567 14.911 32.6828 15.4303 33.1202C15.7919 33.4259 16.2316 33.6248 16.6999 33.6948C17.0821 33.7481 17.9763 33.7212 18.3974 33.721L21.6737 33.7208L28.4989 33.721C29.7002 33.721 30.9234 33.7328 32.1235 33.7187ZM7.30976 30.8192C7.6234 31.9735 7.72986 33.007 8.86565 33.6524C9.29143 33.8903 9.7749 34.0051 10.2621 33.9841C10.6379 33.9697 11.3665 33.7437 11.7624 33.6417C12.3335 33.4948 12.9209 33.3283 13.4934 33.1784C13.5233 33.1704 13.5658 33.1543 13.5951 33.143C13.6075 33.063 13.5147 32.9048 13.4783 32.8301C13.4292 32.7292 13.3911 32.6371 13.3523 32.5317C13.1815 32.0685 13.1086 31.5777 13.1099 31.085C13.1074 29.151 13.1087 27.2159 13.1089 25.2817L13.1095 14.0481L13.1093 9.40427L13.1087 8.04116C13.1086 7.52596 13.0927 7.07923 13.1958 6.56676C13.3951 5.60277 13.9446 4.74686 14.7381 4.16444C15.1914 3.83385 15.7097 3.60347 16.2588 3.4886C16.9253 3.34905 18.0589 3.39739 18.7836 3.396C19.3642 3.39489 20.119 3.37578 20.6847 3.40076C20.1858 2.53715 19.388 1.98592 18.3633 2.03081C17.8392 2.03869 17.2881 2.22617 16.7744 2.3642L15.1635 2.79574L9.23764 4.38431L5.09599 5.49307L3.88387 5.81637C3.63278 5.88307 3.34079 5.95291 3.10085 6.03848C2.73131 6.16614 2.39776 6.38052 2.12815 6.66365C1.65241 7.1574 1.39365 7.82075 1.40939 8.50621C1.4176 8.89568 1.53823 9.27889 1.63903 9.65372L1.91484 10.6789L2.87796 14.2737L5.83008 25.2925C6.31928 27.1185 6.84853 28.9925 7.30976 30.8192Z" />
      <path d="M17.0481 6.21235C17.3682 6.1989 17.7638 6.20897 18.0897 6.20902L20.0168 6.20915L25.904 6.20927L30.0136 6.20913L31.3185 6.20834C31.5726 6.20825 31.8839 6.20031 32.1344 6.22165C32.3505 6.24 32.5568 6.31993 32.7287 6.45197C33.196 6.81714 33.2012 7.26259 33.1902 7.8102C33.1867 7.98626 33.1896 8.1718 33.1893 8.34879L33.1882 10.3243V17.0193L33.1889 26.4994L33.1893 29.5745C33.1893 30.1054 33.194 30.6359 33.1828 31.1666C33.1693 31.7992 32.7229 32.2508 32.1051 32.3251C31.7475 32.3404 31.3417 32.3311 30.9804 32.3311H28.9946L22.9471 32.3308H18.9317L17.7114 32.3325C17.501 32.3329 17.1833 32.3413 16.9789 32.3216C16.7512 32.3005 16.5353 32.2114 16.3591 32.0657C15.8616 31.6507 15.9187 31.208 15.9205 30.6137C15.9212 30.4058 15.9213 30.1934 15.9216 29.9853L15.922 27.6239L15.9221 20.0167L15.9215 11.5138L15.9211 8.76269C15.9211 8.29207 15.9101 7.81354 15.928 7.34396C15.9529 6.69183 16.407 6.26485 17.0481 6.21235ZM17.3292 30.9013C19.2753 30.9375 21.303 30.9094 23.254 30.9094L31.7767 30.906C31.7971 29.9749 31.782 28.9918 31.7822 28.0579L31.7818 22.8386L31.7813 7.63173L22.0632 7.62714L18.8187 7.62749L17.8577 7.62853C17.7019 7.62939 17.482 7.64059 17.3321 7.62784L17.3301 24.233C17.3302 26.4386 17.3554 28.7003 17.3292 30.9013Z" />
      <path d="M24.4707 13.981C25.4778 13.9497 25.5871 14.7909 25.8344 15.5586L26.3655 17.1997C27.2672 17.1787 28.2309 17.2045 29.1323 17.2221C29.9138 17.2373 30.3728 18.3315 29.8382 18.91C29.5882 19.1805 29.223 19.4133 28.918 19.6335C28.4386 19.9765 27.9616 20.3224 27.4866 20.6712C27.7575 21.5409 28.0892 22.419 28.3312 23.2977C28.5401 24.056 27.667 24.8045 26.9452 24.4918C26.6342 24.3571 26.2417 24.0328 25.9513 23.8196L24.5954 22.8296C24.5087 22.7943 24.1207 23.114 24.029 23.181L22.9353 23.9804C22.724 24.1346 22.5057 24.3083 22.2794 24.4369C21.5898 24.8263 20.6607 24.2299 20.7579 23.4348C20.799 23.0982 20.953 22.709 21.0599 22.3838C21.2509 21.8137 21.4373 21.2421 21.619 20.6689C20.8804 20.1085 20.0788 19.5892 19.3564 19.0099C18.7745 18.5432 19.0509 17.3968 19.7993 17.2527C20.1824 17.1789 20.5991 17.2024 20.9964 17.2028L22.7363 17.2028C22.9365 16.6726 23.4863 14.677 23.7282 14.3708C23.923 14.1242 24.167 14.0169 24.4707 13.981Z" />
    </svg>
  );
}

function MockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24.0002 22.73"
      className={className}
      fill="currentColor"
      role="img"
      aria-label="Interactive quiz"
    >
      <path d="M14.1135 7.81906C14.2129 7.81114 14.3128 7.80842 14.4127 7.81087C15.0136 7.83292 15.5813 8.09147 15.9924 8.53019C16.257 8.8142 16.4444 9.16123 16.5367 9.53819C16.6119 9.85145 16.6008 10.2152 16.6009 10.5391L16.6014 11.4019C16.6015 11.9997 16.6184 12.6744 16.5974 13.2638L18.8539 13.5408C19.2689 13.5919 19.982 13.6545 20.3485 13.7803C20.7289 13.9088 21.0744 14.124 21.3575 14.4089C21.8278 14.8853 22.0925 15.5268 22.0953 16.1961C22.0959 16.3843 22.0767 16.5722 22.0377 16.7563C21.9765 17.039 21.8566 17.4166 21.7749 17.6997L21.3127 19.3055L20.9505 20.5658C20.8814 20.806 20.7938 21.1451 20.6994 21.3662C20.5886 21.6313 20.4261 21.8715 20.2215 22.0731C19.9292 22.3629 19.5634 22.5674 19.1635 22.6645C18.8487 22.7393 18.5509 22.7233 18.2301 22.723L17.4311 22.7221L14.6769 22.7226C13.9305 22.7241 13.2894 22.8032 12.6261 22.4063C12.468 22.3121 12.3222 22.1988 12.1919 22.0687C11.9405 21.8143 11.6098 21.415 11.3661 21.1387L9.7773 19.3344L8.66172 18.0681C8.4746 17.8558 8.20438 17.569 8.04536 17.3474C7.88755 17.1275 7.77281 16.8796 7.70723 16.617C7.56051 16.0382 7.65138 15.4247 7.95959 14.9133C8.26484 14.4011 8.76626 14.036 9.34743 13.9028C10.1704 13.7066 10.6969 13.9725 11.3614 14.3843L12.0728 14.822L12.0734 11.4544L12.073 10.5403C12.0729 10.2406 12.063 9.95312 12.1158 9.65664C12.1774 9.31682 12.3173 8.99598 12.5243 8.71951C12.9312 8.17021 13.4523 7.91676 14.1135 7.81906ZM13.9978 21.2681L17.3243 21.2677L18.2179 21.2685C18.3997 21.2687 18.6295 21.2814 18.8054 21.251C19.36 21.1551 19.4311 20.6045 19.5557 20.1671L19.8375 19.1876L20.3393 17.4466C20.4433 17.0851 20.591 16.6494 20.6438 16.2839C20.7091 15.8332 20.344 15.2813 19.904 15.163C19.6141 15.0849 19.2847 15.0575 18.9828 15.0201L16.7713 14.7496C16.595 14.7278 16.4156 14.7107 16.2401 14.6863C15.9782 14.6497 15.6855 14.6535 15.4619 14.499C15.2113 14.326 15.1488 14.0771 15.1512 13.7882C15.1483 12.6019 15.1504 11.4159 15.1523 10.2294C15.1525 10.1223 15.1524 10.0171 15.1317 9.91153C15.0995 9.74596 15.0165 9.59455 14.8941 9.47839C14.6857 9.27925 14.4638 9.25543 14.1923 9.27826C13.8221 9.34699 13.574 9.61584 13.5344 9.98993C13.5139 10.1835 13.5235 10.401 13.5236 10.5974L13.5245 11.6087L13.525 15.0115C13.525 15.0736 13.5289 15.1436 13.525 15.2046C13.4879 15.775 13.7238 16.681 12.9467 16.8361C12.8171 16.8613 12.6829 16.8513 12.5583 16.807C12.4001 16.7488 11.9728 16.4686 11.8122 16.3686L10.5943 15.6171C10.4443 15.524 10.2466 15.3751 10.0759 15.3289C9.75722 15.2425 9.41531 15.3519 9.22443 15.6272C9.05102 15.8772 9.04067 16.2795 9.23942 16.5187C9.52984 16.8682 9.83984 17.2103 10.1413 17.5522L11.8242 19.4618L12.7597 20.524C12.9175 20.7035 13.1583 20.9984 13.3402 21.1465C13.4954 21.2727 13.8029 21.2695 13.9978 21.2681Z" />
      <path d="M2.1949 0.00989879C2.64444 -0.0087399 3.17635 0.00465437 3.63024 0.00470468L6.30698 0.00478009L7.81909 0.00441538C8.1127 0.0044028 8.5626 -0.00923036 8.83877 0.0381461C9.23359 0.105431 9.60438 0.273419 9.91531 0.525883C10.3976 0.91429 10.7046 1.47927 10.7683 2.09521C10.8005 2.42909 10.7837 2.97862 10.7836 3.33509L10.7835 5.56824L10.7836 7.61152C10.7836 7.94527 10.8003 8.52928 10.7478 8.8374C10.6777 9.24064 10.5027 9.61833 10.2404 9.93254C9.81642 10.4464 9.25697 10.7097 8.60311 10.7724C8.58507 10.7744 8.56701 10.7761 8.54891 10.7776C8.21211 10.8044 7.71167 10.7879 7.35974 10.7879L5.18771 10.788L3.28236 10.788C2.87204 10.788 2.31094 10.807 1.91816 10.7369C1.52144 10.6628 1.15096 10.4863 0.843455 10.225C-0.132777 9.38775 0.0078721 8.44171 0.00817646 7.29502L0.00828968 5.03478L0.00800796 3.18962C0.00800545 2.80998 -0.0108521 2.25229 0.0571917 1.89029C0.136845 1.48346 0.32239 1.10484 0.595103 0.792623C1.00318 0.329498 1.57881 0.0478679 2.1949 0.00989879ZM8.56267 9.31712C8.99599 9.23901 9.31255 8.92482 9.32853 8.47231C9.34361 8.04545 9.33683 7.61696 9.33695 7.18965L9.33722 4.74333L9.33692 3.06535C9.33674 2.55481 9.43615 1.92189 8.94321 1.60651C8.80617 1.51885 8.67315 1.47363 8.50937 1.4648C8.0846 1.44981 7.64484 1.4584 7.21885 1.45852L4.6919 1.45869L3.07024 1.45833C2.89551 1.45792 2.40512 1.44498 2.25843 1.46811C2.00685 1.49598 1.81319 1.58644 1.65205 1.78796C1.55156 1.91538 1.48859 2.0683 1.47021 2.22955C1.4451 2.45135 1.4595 3.06253 1.45958 3.31073L1.45978 5.42586L1.45946 7.48382C1.4592 7.83001 1.44988 8.21343 1.47094 8.55815C1.48381 8.76881 1.63385 9.00849 1.80205 9.13915C1.92711 9.23645 2.07653 9.29746 2.23394 9.31549C2.4371 9.33863 2.88859 9.32276 3.11213 9.32264L4.86898 9.3226L7.28967 9.32289C7.64848 9.32304 8.21641 9.34051 8.56267 9.31712Z" />
      <path d="M4.25862 3.60573C4.62249 3.57259 4.81668 3.78102 5.04983 4.0149C5.16424 4.1301 5.27963 4.24431 5.39601 4.35754C5.71849 4.08351 5.97935 3.63482 6.40506 3.60391C6.60263 3.58909 6.79772 3.6553 6.94543 3.78732C7.08756 3.91338 7.17352 4.09093 7.18425 4.28062C7.20997 4.7485 6.71445 5.07352 6.42242 5.39643C6.50857 5.46896 6.63079 5.59505 6.71308 5.67718C6.91623 5.88324 7.15475 6.0692 7.18263 6.37993C7.22036 6.80039 6.92498 7.13669 6.51416 7.18031C6.15678 7.19147 5.99502 7.02201 5.7594 6.78173C5.64037 6.66036 5.51496 6.5326 5.38934 6.41784C5.37602 6.43291 5.36238 6.44768 5.3484 6.46215C5.24936 6.56421 5.14575 6.66648 5.04494 6.76694C4.83376 6.9774 4.65603 7.18282 4.33184 7.18278C4.13341 7.18135 3.94396 7.09992 3.80636 6.95694C3.67081 6.819 3.59853 6.63103 3.60674 6.43781C3.61781 6.11038 3.81672 5.93707 4.03278 5.72272C4.14323 5.61171 4.25566 5.50271 4.37005 5.39577C4.12513 5.12972 3.66116 4.79124 3.61288 4.42703C3.55753 4.00948 3.83966 3.66074 4.25862 3.60573Z" />
      <path d="M15.4139 0.00993415C15.8893 -0.00748459 16.4318 0.00466458 16.9109 0.00475261L19.5777 0.00468967L21.0638 0.00443818C21.354 0.00445075 21.798 -0.00859132 22.0721 0.0413382C22.6891 0.152793 23.2358 0.506903 23.5897 1.02446C23.7938 1.32196 23.9251 1.66332 23.9729 2.02092C24.0113 2.31995 23.9969 2.86203 23.9968 3.18225L23.9964 5.16446L23.997 7.46446C23.997 7.84302 24.0185 8.54264 23.9493 8.8964C23.8268 9.50369 23.4682 10.0376 22.9525 10.381C22.6923 10.5564 22.3992 10.6773 22.0909 10.7365C21.7852 10.7932 21.4064 10.7817 21.0927 10.782L19.8899 10.7827L19.1236 10.7826C18.9744 10.7825 18.8325 10.7813 18.6834 10.7753C18.2102 10.7561 17.8737 10.3336 17.9959 9.864C18.0544 9.63688 18.2204 9.45279 18.4404 9.37113C18.6333 9.29983 19.0284 9.32273 19.2485 9.32307L20.8976 9.3239C21.2536 9.32394 21.8082 9.37585 22.1092 9.19763C22.3362 9.0797 22.5224 8.79006 22.5375 8.53483C22.5554 8.23163 22.5449 7.91661 22.5448 7.61186V5.74573L22.5456 3.44509C22.5459 3.04345 22.5546 2.63406 22.5366 2.23321C22.5212 1.88717 22.1723 1.50561 21.8244 1.47644C21.4505 1.44507 21.0571 1.45789 20.6802 1.45789L18.6101 1.45794L16.5301 1.45818C16.1689 1.4582 15.7744 1.44685 15.4195 1.47347C15.1242 1.49563 14.8255 1.75402 14.7323 2.0306C14.6502 2.27402 14.6747 2.70594 14.6749 2.97606V4.92016C14.6751 5.21626 14.6865 5.54596 14.6646 5.83923C14.6464 5.96938 14.5991 6.08989 14.517 6.19136C14.085 6.72554 13.2515 6.43896 13.2301 5.75428C13.2245 5.56948 13.2256 5.38072 13.2258 5.19471L13.2271 4.20711L13.2262 2.97242C13.2255 2.12415 13.2004 1.48907 13.805 0.798796C14.2146 0.331747 14.7939 0.0477523 15.4139 0.00993415Z" />
      <path d="M20.0844 3.8832C20.566 3.8283 20.9735 4.19943 20.912 4.68887C20.8945 4.82568 20.8378 4.95451 20.7487 5.05981C20.6563 5.17037 20.1418 5.5719 20.0005 5.68543L18.5091 6.8881C18.294 7.06021 18.1293 7.18277 17.8346 7.15148C17.465 7.11226 17.2484 6.75353 17.0331 6.47538C16.8887 6.28432 16.4508 5.76991 16.3651 5.58175C16.3236 5.4889 16.3025 5.38825 16.3032 5.28656C16.3055 5.09088 16.3852 4.90407 16.5251 4.76711C16.6683 4.62724 16.8416 4.56719 17.0394 4.56918C17.5403 4.57419 17.724 5.06248 18.0343 5.38716L18.0465 5.39977C18.4207 5.09206 18.7968 4.78672 19.1749 4.48376C19.427 4.27999 19.7693 3.94335 20.0844 3.8832Z" />
    </svg>
  );
}

function CurveSign({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 55.7333 55.7333"
      className={className}
      fill="none"
      role="img"
      aria-label="Curve to the right ahead"
    >
      <path
        d="M52.3725 24.2731L31.6053 3.50592C29.5408 1.44143 26.1936 1.44143 24.1291 3.50592L3.36187 24.2731C1.29737 26.3376 1.29737 29.6848 3.36187 31.7493L24.1291 52.5166C26.1936 54.5811 29.5408 54.5811 31.6053 52.5166L52.3725 31.7493C54.437 29.6848 54.437 26.3376 52.3725 24.2731Z"
        fill="#F2B600"
        stroke="#141414"
        strokeWidth="2.32222"
      />
      <path
        d="M25.0801 40.8711V30.1888C25.0801 25.5444 27.4023 23.2222 32.0467 23.2222H35.7623"
        stroke="#141414"
        strokeWidth="3.01889"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M34.3711 19.042L40.8733 23.222L34.3711 27.402V19.042Z" fill="#141414" />
    </svg>
  );
}
