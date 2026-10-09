"use client";

import { SearchX } from "lucide-react";
import * as motion from "motion/react-client";
import type { ReactNode } from "react";

/**
 * One placeholder card. The blocks are sized like the real card's title, meta line and footer so
 * the grid doesn't reflow when results replace it — a skeleton that settles into a different shape
 * is worse than no skeleton, because the page appears to jump at the exact moment it finishes.
 */
function SkeletonCard({ withImage }: { withImage: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      {withImage && <div className="h-32 w-full rounded-xl bg-muted" />}
      <div className="flex items-start justify-between gap-2">
        <div className="h-5 w-3/5 rounded bg-muted" />
        <div className="h-5 w-16 shrink-0 rounded-full bg-muted" />
      </div>
      <div className="h-4 w-4/5 rounded bg-muted" />
      <div className="h-4 w-2/5 rounded bg-muted" />
    </div>
  );
}

/**
 * A browse page's results area: placeholders while the request is in flight, an empty state when
 * the filters genuinely match nothing, and the cards themselves otherwise.
 *
 * Keeping all three here is the point. Read straight from a paginated response, `rows.length === 0`
 * is true both before the first response arrives and when nothing matched, so a page that branches
 * on it alone flashes "nothing found" over results that are on their way — which is exactly what
 * a filtered URL like `?state=AL&vehicle_type=car` did on first paint.
 */
export default function BrowseGrid({
  loading,
  count,
  skeletonCount = 6,
  skeletonHasImage = false,
  emptyTitle,
  emptyHint,
  children,
}: {
  loading: boolean;
  /** How many rows arrived. Only `0` with `loading === false` is a real empty state. */
  count: number;
  skeletonCount?: number;
  /** Cheat-sheet cards lead with a cover image; quiz cards don't. */
  skeletonHasImage?: boolean;
  emptyTitle: string;
  emptyHint: string;
  children: ReactNode;
}) {
  if (loading && count === 0) {
    return (
      <div
        className="grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-busy="true"
        aria-label="Loading results"
      >
        {Array.from({ length: skeletonCount }, (_, i) => (
          <SkeletonCard key={i} withImage={skeletonHasImage} />
        ))}
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
        <SearchX aria-hidden className="size-8 text-muted-foreground" />
        <p className="font-medium text-foreground">{emptyTitle}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{emptyHint}</p>
      </div>
    );
  }

  return (
    // A refetch keeps the old cards on screen and dims them, rather than dropping back to
    // skeletons — paging or narrowing a filter shouldn't blank out what you were just reading.
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: loading ? 0.55 : 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
