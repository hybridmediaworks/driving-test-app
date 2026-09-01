import { CircleCheck } from "lucide-react";
import Heading from "@/components/ui/Heading";

const STATS = [
  { value: "4,813", label: "practicing live right now" },
  { value: "47", label: "states active today" },
  { value: "4,813", label: "drivers passed all time" },
];

const PASSERS = [
  { name: "Maria R.", state: "Texas" },
  { name: "Devon K.", state: "Ohio" },
  { name: "Aisha M.", state: "Georgia" },
  { name: "James T.", state: "Florida" },
];

const LEGEND = [
  { label: "High", color: "bg-green-300" },
  { label: "Medium", color: "bg-yellow-200" },
  { label: "Low", color: "bg-red-200" },
];

export default function MapSection() {
  return (
    <section className="bg-background2 px-5 py-16 lg:py-[120px]">
      <div className="mx-auto max-w-container">
        {/* Eyebrow + headline with hand-drawn green underline */}
        <div className="flex flex-col items-center gap-8 text-center">
          <p className="border-b border-blue-100 px-3.5 pt-[5px] pb-1.5 text-xs font-bold leading-[18px] tracking-[0.1em] text-blue-700 uppercase">
            <span className="mr-1.5">✦</span>Helping drivers across the USA
          </p>
          <Heading as="h2">
            Live across{" "}
            <span className="relative inline-block whitespace-nowrap">
              America
              <svg
                aria-hidden="true"
                viewBox="0 0 429 16"
                preserveAspectRatio="none"
                fill="none"
                className="pointer-events-none absolute bottom-[-0.08em] left-0 h-[0.24em] w-full"
              >
                <path
                  d="M397.324 9.57165C382.141 9.57165 366.958 9.68155 351.775 9.54168C339.6 9.43178 327.425 8.84232 315.233 8.77238C304.695 8.71244 294.087 8.73241 283.621 9.35185C261.638 10.6407 239.762 12.549 217.762 13.7579C207.171 14.3374 196.812 13.3682 186.488 11.0703C169.65 7.32368 152.188 9.13203 135.047 11.0903C125.044 12.2292 115.13 13.598 105.126 14.6671C96.2442 15.6162 88.3411 14.727 81.1323 11.1402C73.87 7.5235 64.5074 8.42268 56.106 9.53168C43.8955 11.1302 31.952 13.3782 19.9373 15.4364C12.408 16.7252 5.60858 15.876 1.01628 12.1393C-0.496688 10.9104 -0.12289 8.5126 0.856089 6.94401C1.26548 6.28461 6.14254 5.71511 7.8869 6.24463C13.4582 7.93311 18.3353 6.78417 23.515 5.92494C38.7514 3.39722 54.0235 0.689665 70.1678 1.45897C75.4009 1.70875 81.3459 2.38814 85.4042 4.05663C93.6454 7.45357 102.118 6.81412 110.929 5.96489C126.112 4.49621 141.224 2.7678 156.46 1.52892C167.799 0.609745 178.941 1.39902 189.835 3.76689C203.487 6.72422 217.816 5.96491 231.895 5.05573C255.426 3.5371 278.833 1.20919 302.417 0.140154C315.446 -0.449315 328.725 0.999367 341.914 1.1892C359.536 1.43897 377.175 1.2991 394.815 1.43897C403.91 1.50891 413.059 1.61882 422.084 2.19829C424.611 2.35815 428.296 4.05662 428.83 5.38542C429.916 8.06301 425.59 8.25285 421.995 8.36275C413.789 8.6325 405.584 8.92222 397.378 9.21196C397.378 9.33185 397.36 9.45175 397.342 9.56165L397.324 9.57165Z"
                  fill="#22C55E"
                />
              </svg>
            </span>
          </Heading>
        </div>

        {/* Stats · map · live passer feed */}
        <div className="mt-12 grid items-center gap-8 lg:grid-cols-[minmax(0,230px)_minmax(0,1fr)_minmax(0,230px)] lg:gap-6">
          {/* Left — stat cards */}
          <div className="order-2 flex w-full max-w-sm flex-col gap-6 justify-self-center lg:order-1 lg:max-w-none">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-background3 bg-white p-4 shadow-[0px_1px_1px_rgba(14,17,22,0.06),0px_2px_3px_rgba(14,17,22,0.05)]"
              >
                <p className="font-sora text-5xl font-semibold leading-[56px] tracking-[-0.96px] text-neutral-700">
                  {stat.value}
                </p>
                <p className="mt-2 text-base text-neutral-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Center — exact Figma US density map (node 1659:7812, exported as SVG) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/maps/us-live-map.svg"
            alt="Live driver activity across the United States, colour-coded by high, medium, and low density"
            className="order-1 mx-auto w-full max-w-[760px] lg:order-2"
          />

          {/* Right — live passer feed */}
          <div className="order-3 flex w-full max-w-sm flex-col gap-3.5 justify-self-center lg:max-w-none">
            {PASSERS.map((p, i) => (
              <div
                key={`${p.name}-${p.state}-${i}`}
                className="rounded-2xl border border-background3 bg-white p-4 shadow-[0px_1px_1px_rgba(14,17,22,0.06),0px_2px_3px_rgba(14,17,22,0.05)]"
              >
                <p className="text-xl font-semibold leading-[30px] text-neutral-700">
                  {p.name} - {p.state}
                </p>
                <p className="mt-2 flex items-center gap-2 text-base text-neutral-500">
                  <CircleCheck className="size-6 shrink-0 text-green-500" />
                  Passed 2 mins ago.
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-10 flex items-center justify-center gap-4">
          {LEGEND.map((item) => (
            <span key={item.label} className="flex items-center gap-3">
              <span
                className={`size-5 rounded-[4px] border border-background3 ${item.color}`}
              />
              <span className="text-base font-semibold text-neutral-500">
                {item.label}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
