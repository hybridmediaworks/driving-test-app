import Link from "next/link";
import { FileText, Lock } from "lucide-react";
import type { PublicCheatSheet } from "@driving-test-app/shared";

/**
 * One cheat sheet in a browse grid. Same lift-on-hover as the quiz card, but the cover image leads
 * — these are visual one-pagers, and the picture is what tells them apart at a glance.
 *
 * Cheat sheets with no cover get a tinted panel rather than a collapsed card, so a row stays an
 * even grid instead of some cards being a third shorter than their neighbours.
 */
export default function CheatSheetCard({ sheet }: { sheet: PublicCheatSheet }) {
  const scope = [sheet.category?.title, sheet.state?.name, sheet.vehicle_type?.title].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/cheat-sheets/${sheet.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[0_20px_44px_-26px_rgba(16,24,40,0.5)] focus-visible:ring-2 focus-visible:ring-chart-1 focus-visible:outline-none"
    >
      <div className="relative h-36 overflow-hidden bg-muted">
        {sheet.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sheet.cover_image_url}
            alt=""
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="flex size-full items-center justify-center bg-chart-1/10">
            <FileText aria-hidden className="size-8 text-chart-1" />
          </span>
        )}
        {sheet.locked && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/55 backdrop-blur-[2px]">
            <Lock aria-hidden className="size-6 text-foreground" />
          </span>
        )}
        {sheet.is_premium && (
          <span className="absolute top-3 right-3 rounded-full bg-amber-500/90 px-2 py-0.5 text-xs font-medium text-amber-950">
            Premium
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-semibold text-foreground transition-colors group-hover:text-chart-1">{sheet.title}</h3>
        <p className="line-clamp-3 text-sm text-muted-foreground">{sheet.summary}</p>
        {scope && <p className="mt-auto border-t border-border pt-3 text-xs text-muted-foreground">{scope}</p>}
      </div>
    </Link>
  );
}
