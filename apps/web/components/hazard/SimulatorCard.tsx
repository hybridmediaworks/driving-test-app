import Link from "next/link";
import { AlertTriangle, CheckCircle2, Gauge, Lock, MapPin, Video } from "lucide-react";
import type { PublicHazardSimulator } from "@driving-test-app/shared";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")} min`;
}

/** A hazard simulator teaser card — thumbnail, premium/lock state, meta chips, and a best-score
 * badge once attempted. Shared by the browse-all list and the player page's "More simulators" rail. */
export default function SimulatorCard({ simulator }: { simulator: PublicHazardSimulator }) {
  return (
    <Link
      href={`/hazard-simulator/${simulator.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[0_20px_44px_-26px_rgba(16,24,40,0.5)] focus-visible:ring-2 focus-visible:ring-chart-1 focus-visible:outline-none"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {simulator.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={simulator.thumbnail_url}
            alt=""
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          // A hundred-odd simulators are hosted on a Vimeo video that serves no thumbnail at all,
          // so this is a normal state rather than an error — an empty grey box just looked broken.
          <span className="flex size-full items-center justify-center bg-chart-1/10">
            <Video aria-hidden className="size-8 text-chart-1" />
          </span>
        )}
        {simulator.is_premium && (
          <span className="absolute left-2 top-2 rounded-sm bg-orange-500 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
            Premium
          </span>
        )}
        {simulator.locked && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
            <Lock className="h-6 w-6 text-blue-700 dark:text-blue-300" />
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <p className="font-semibold text-neutral-900 dark:text-neutral-100">{simulator.title}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="font-semibold text-blue-500">{simulator.hazard_count} hazards</span>
          {simulator.duration_seconds ? <span>{formatDuration(simulator.duration_seconds)}</span> : null}
          {simulator.test_level && (
            <span className="inline-flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" /> {simulator.test_level}
            </span>
          )}
          {simulator.test_location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {simulator.test_location}
            </span>
          )}
        </div>
        {simulator.attempted && (
          <p
            className={`flex items-center gap-1 text-xs font-medium ${
              simulator.passed === true
                ? "text-green-600"
                : simulator.passed === false
                  ? "text-red-600"
                  : "text-neutral-500 dark:text-neutral-400"
            }`}
          >
            {simulator.passed === true && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
            {simulator.passed === false && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
            Best score: {simulator.best_score}%
          </p>
        )}
      </div>
    </Link>
  );
}
