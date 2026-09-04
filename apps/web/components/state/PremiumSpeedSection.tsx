"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * "2x faster prep — Students with Premium finish prep faster" — the full-bleed roundabout banner
 * that sits between the phase ladder and the exam simulator (Figma file i86zaHUyFDEleJ5LTVnOdh,
 * node 4147:8161). Photo backdrop at 40% black, a soft blue glow behind the copy, and the green
 * hand-drawn underline under the "2x faster prep" line.
 *
 * Renders for everyone, entitled subscribers included — the design has no signed-in variant, and
 * hiding it left a visible gap in the page between the ladder and the exam simulator.
 */
export default function PremiumSpeedSection() {
  return (
    <section className="relative isolate overflow-hidden px-5 py-20 lg:py-30">
      {/* Backdrop */}
      <div aria-hidden className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/state-hub/premium-bg.jpg"
          alt=""
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        {/* Soft blue glow centred behind the headline (Figma "Ellipse 1") */}
        <div className="absolute top-1/2 left-[calc(50%-var(--hub-rail-space,0px)/2)] h-[186px] w-[409px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/40 blur-[80px]" />
      </div>

      <div className="mx-auto flex max-w-[923px] flex-col items-center gap-4 text-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative inline-block">
            <p className="font-sora font-semibold text-neutral-100">
              <span className="text-[64px] leading-none tracking-[-1.28px] sm:text-[88px] lg:text-[120px] lg:leading-[90px] lg:tracking-[-2.4px]">
                2x
              </span>{" "}
              <span className="text-[20px] leading-tight sm:text-[24px] lg:text-[30px] lg:leading-[38px]">
                faster prep
              </span>
            </p>
            {/* Hand-drawn green underline (Figma node 4147:8168) */}
            <svg
              aria-hidden
              viewBox="0 0 237 8"
              fill="none"
              preserveAspectRatio="none"
              className="pointer-events-none absolute -bottom-1 left-[42%] h-[6px] w-[58%] lg:-bottom-2 lg:h-2"
            >
              <path
                d="M219.501 4.78582C211.113 4.78582 202.725 4.84078 194.337 4.77084C187.611 4.71589 180.885 4.42116 174.15 4.38619C168.328 4.35622 162.468 4.3662 156.686 4.67592C144.541 5.32034 132.456 6.27448 120.302 6.87894C114.451 7.16868 108.728 6.68411 103.025 5.53515C93.7226 3.66184 84.0761 4.56602 74.6065 5.54513C69.0802 6.11462 63.603 6.79901 58.0767 7.33353C53.1699 7.8081 48.8038 7.3635 44.8213 5.57012C40.8093 3.76175 35.637 4.21134 30.9956 4.76584C24.25 5.56512 17.6518 6.68911 11.0143 7.71818C6.85479 8.3626 3.09844 7.93799 0.561441 6.06967C-0.274394 5.45522 -0.0678902 4.2563 0.472944 3.47201C0.699111 3.1423 3.39343 2.85756 4.3571 3.12232C7.43494 3.96656 10.1293 3.39209 12.9908 2.96247C21.4081 1.69861 29.8452 0.344833 38.764 0.729486C41.655 0.854373 44.9394 1.19407 47.1814 2.02832C51.7342 3.72679 56.4149 3.40706 61.2824 2.98244C69.6702 2.24811 78.0187 1.3839 86.4361 0.764458C92.6999 0.304872 98.8556 0.699512 104.874 1.88344C112.416 3.36211 120.332 2.98246 128.11 2.52787C141.11 1.76855 154.04 0.604595 167.07 0.0700768C174.268 -0.224657 181.603 0.499683 188.89 0.594598C198.625 0.719485 208.37 0.649548 218.114 0.719485C223.139 0.754454 228.194 0.809409 233.179 1.09915C234.575 1.17908 236.611 2.02831 236.906 2.69271C237.506 4.0315 235.116 4.12642 233.13 4.18137C228.597 4.31625 224.064 4.46111 219.53 4.60598C219.53 4.66592 219.521 4.72587 219.511 4.78082L219.501 4.78582Z"
                fill="#22C55E"
              />
            </svg>
          </div>

          <h2 className="max-w-[687px] font-sora text-[32px] leading-tight font-semibold tracking-[-1.12px] text-neutral-100 md:text-[44px] lg:text-[56px] lg:leading-16">
            Students with Premium finish prep faster
          </h2>
        </div>

        <div className="flex flex-col items-center gap-6">
          <p className="max-w-[646px] pt-0.5 text-base leading-7 text-neutral-300 lg:text-xl lg:leading-[30px]">
            Unlock unlimited questions, ad-free studying, and a money-back
            guarantee.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-blue-500 to-blue-800 px-8 py-4 text-base font-semibold text-white shadow-xs drop-shadow-[0px_12px_8px_rgba(0,0,0,0.08),0px_4px_3px_rgba(0,0,0,0.03)] transition-opacity hover:opacity-95 lg:px-12"
          >
            Try for Free
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
