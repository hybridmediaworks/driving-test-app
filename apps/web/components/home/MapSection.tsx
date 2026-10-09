import { MapPin, Trophy, Users, type LucideIcon } from "lucide-react";
import RecentPasses from "@/components/home/RecentPasses";
import {
  DRIVERS_PASSED_TOTAL,
  DRIVERS_PRACTICING_NOW,
  numberFormat,
  STATES_ACTIVE_TODAY,
} from "@/components/home/stateActivity";
import UsActivityMap from "@/components/home/UsActivityMap";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";

type Stat = {
  icon: LucideIcon;
  value: string;
  label: string;
  tint: string;
};

const stats: Stat[] = [
  {
    icon: Users,
    value: numberFormat.format(DRIVERS_PRACTICING_NOW),
    label: "drivers practicing right now",
    tint: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  },
  {
    icon: MapPin,
    value: String(STATES_ACTIVE_TODAY),
    label: "states active today",
    tint: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  },
  {
    icon: Trophy,
    value: DRIVERS_PASSED_TOTAL,
    label: "total drivers passed using Drive Lane",
    tint: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400",
  },
];

export default function MapSection() {
  return (
    <section
      aria-labelledby="live-across-america"
      className="bg-background2 px-5 py-16 lg:py-[120px]"
    >
      <div className="mx-auto max-w-container">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold tracking-[0.1em] text-blue-600 uppercase ring-1 ring-blue-100 dark:bg-neutral-800 dark:text-blue-400 dark:ring-white/10">
            <MapPin className="size-3.5" aria-hidden />
            Drivers in every state
          </span>
          <Heading as="h2" size="lg" weight="bold" id="live-across-america">
            Live across <span className="text-blue-500">America</span>
          </Heading>
          <Paragraph className="max-w-161" size="xl">
            From California to Maine, thousands of drivers are practicing and passing with
            Drive Lane every day.
          </Paragraph>
        </div>

        {/* 12-column split at xl (stats · map · recent passes), a single stack below it —
            the map needs the full column width to stay readable on narrow screens. */}
        <div className="mt-12 grid gap-6 xl:grid-cols-12 xl:items-center xl:gap-8">
          <div className="grid gap-4 sm:grid-cols-3 xl:col-span-3 xl:grid-cols-1">
            {stats.map(({ icon: Icon, value, label, tint }) => (
              <article
                key={label}
                className="relative flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-card dark:border-white/10 dark:bg-neutral-800"
              >
                <span
                  aria-hidden
                  className={`grid size-12 shrink-0 place-items-center rounded-xl ${tint}`}
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-sora text-2xl font-bold tracking-tight text-neutral-900 tabular-nums dark:text-neutral-100">
                    {value}
                  </p>
                  <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                    {label}
                  </p>
                </div>
                <span
                  aria-hidden
                  className="absolute top-4 right-4 size-2 rounded-full bg-green-500"
                />
              </article>
            ))}
          </div>

          <div className="xl:col-span-6">
            <UsActivityMap />
          </div>

          <div className="xl:col-span-3">
            <RecentPasses />
          </div>
        </div>
      </div>
    </section>
  );
}
