import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * "Every tool built for the moment it matters." — a full-bleed aerial-road photo
 * with a left-side dark gradient; a white headline + "Try for Free" button on the
 * left, and a cluster of five product cards on the right (AI Tutor, Mock Exams on
 * top; Progress Tracking, Voice Learning, Flashcards below). Pixel-matched to
 * Figma node 1904:3502 (file QOJ34F4OPHkJ5LFrJt9eCA). Icon glyphs are the exact
 * Figma vectors (white) on solid colour tiles.
 */
export default function FeaturesSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Road background + left dark gradient */}
      <div aria-hidden className="absolute inset-0 z-0">
        <Image
          src="/features/road-bg.png"
          alt=""
          fill
          quality={90}
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-l from-transparent from-41% to-black/50" />
      </div>

      <div className="relative z-10 mx-auto max-w-container px-5 py-16 lg:py-[104px]">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          {/* Left — headline + subtitle + CTA */}
          <div className="max-w-[460px] shrink-0">
            <h2 className="font-sora text-[40px] leading-[1.1] font-semibold tracking-[-1.12px] text-neutral-50 lg:text-[56px] lg:leading-[64px]">
              Every tool built for the moment it matters.
            </h2>
            <p className="mt-4 max-w-[440px] text-xl leading-[30px] text-neutral-200">
              One platform, from your first practice question to the seat of the
              examiner&rsquo;s car.
            </p>
            <Link
              href="/features-overview"
              className="group mt-6 inline-flex items-center gap-2 rounded-full bg-linear-to-r from-[#3b82f6] to-[#1e40af] px-8 py-4 text-base font-semibold text-white shadow-[0px_12px_8px_0px_rgba(0,0,0,0.08),0px_4px_3px_0px_rgba(0,0,0,0.03)]"
            >
              Try for Free
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Right — five cards */}
          <div className="flex w-full max-w-[738px] flex-col gap-5">
            {/* Top row */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TopCard
                tileClass="rounded-[12px] bg-[#a855f7]"
                icon={
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/features/ai-tutor.svg" alt="" aria-hidden className="size-8" />
                }
                title="AI Tutor"
                body="Ask anything and get answers, plus drills that adapt to you."
              />
              <TopCard
                tileClass="rounded-[8px] bg-[#f97316]"
                icon={
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/features/mock.svg" alt="" aria-hidden className="w-6" />
                }
                title="Mock Exams"
                body="Real DMV format and timing, scored instantly every attempt."
              />
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <StatCard
                icon={<ProgressRing />}
                title="Progress Tracking"
                body="A readiness score that tells you exactly when to book the test."
                borderClass="border-green-200"
                tint="radial-gradient(130% 130% at 50% 100%, #dcfce7 0%, #ffffff 55%)"
                dotClass="bg-green-500"
                labelClass="text-green-500"
                label="On track to pass"
              />
              <StatCard
                icon={
                  <span className="flex size-[60px] items-center justify-center rounded-[16px] bg-[#eab308]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/features/waveform.svg" alt="" aria-hidden className="w-9" />
                  </span>
                }
                title="Voice Learning"
                body="Study hands-free, on the move — answer aloud on your commute."
                borderClass="border-background3"
                tint="radial-gradient(130% 130% at 50% 100%, #fefce8 0%, #ffffff 55%)"
                dotClass="bg-yellow-500"
                labelClass="text-yellow-500"
                label="12 min avg session"
              />
              <StatCard
                icon={
                  <span className="flex size-[60px] items-center justify-center rounded-[16px] bg-[#ef4444]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/features/flashcards.svg" alt="" aria-hidden className="size-9" />
                  </span>
                }
                title="Flashcards"
                body="Spaced repetition that locks signs and rules into long-term memory."
                borderClass="border-background3"
                tint="radial-gradient(130% 130% at 50% 100%, #fef2f2 0%, #ffffff 55%)"
                dotClass="bg-red-500"
                labelClass="text-red-500"
                label="240 cards mastered"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Top-row card — centred icon tile + title + body, white/blue radial bg. */
function TopCard({
  tileClass,
  icon,
  title,
  body,
}: {
  tileClass: string;
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-[24px] border border-blue-200 p-12 text-center shadow-[0px_30px_64px_-28px_rgba(16,24,40,0.3),0px_8px_18px_0px_rgba(16,24,40,0.07)]"
      style={{
        backgroundImage:
          "radial-gradient(130% 130% at 0% 0%, #dbeafe 0%, #ffffff 46%)",
      }}
    >
      <span
        className={`flex size-[60px] items-center justify-center ${tileClass}`}
      >
        {icon}
      </span>
      <h3 className="font-sora text-2xl leading-8 font-semibold text-neutral-900">
        {title}
      </h3>
      <p className="max-w-[292px] text-base leading-6 text-neutral-700">{body}</p>
    </div>
  );
}

/* Bottom-row stat card — icon + centred title/body + colour-coded status line. */
function StatCard({
  icon,
  title,
  body,
  borderClass,
  tint,
  dotClass,
  labelClass,
  label,
}: {
  icon: ReactNode;
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
      className={`flex h-full flex-col items-center gap-5 rounded-[24px] border p-6 text-center shadow-[0px_1px_2px_0px_rgba(14,17,22,0.06),0px_2px_6px_0px_rgba(14,17,22,0.05)] ${borderClass}`}
      style={{ backgroundImage: tint }}
    >
      {icon}
      <h3 className="font-sora text-2xl leading-8 font-semibold text-[#0b0b0d]">
        {title}
      </h3>
      <p className="text-base leading-6 text-neutral-700">{body}</p>
      <div className="mt-auto flex items-center gap-1.5 pt-1">
        <span className={`size-3 shrink-0 rounded-full ${dotClass}`} />
        <span className={`text-base leading-6 whitespace-nowrap ${labelClass}`}>
          {label}
        </span>
      </div>
    </div>
  );
}

/* Green readiness ring with the "80%" label — exact Figma geometry. */
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
