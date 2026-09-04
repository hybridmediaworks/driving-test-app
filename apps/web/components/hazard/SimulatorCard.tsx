import Link from "next/link";
import { AlertTriangle, CheckCircle2, Gauge, Lock, MapPin } from "lucide-react";
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
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-card transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-100">
        {simulator.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={simulator.thumbnail_url} alt="" className="h-full w-full object-cover" />
        ) : null}
        {simulator.is_premium && (
          <span className="absolute left-2 top-2 rounded-sm bg-orange-500 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
            Premium
          </span>
        )}
        {simulator.locked && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
            <Lock className="h-6 w-6 text-blue-700" />
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <p className="font-semibold text-neutral-900">{simulator.title}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
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
                  : "text-neutral-500"
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
