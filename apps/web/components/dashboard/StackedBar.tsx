export type StackedBarSegment = {
  value: number;
  label: string;
  /** Tailwind background utility, e.g. "bg-status-good" or "bg-chart-2". */
  colorClassName: string;
  /** Defaults to white — pass a dark text class for light-fill segments (e.g. neutral gray). */
  textClassName?: string;
};

/**
 * Part-to-whole as a horizontal stacked bar (never a pie/donut — see the dataviz skill's
 * "part-to-whole rides the stacked bar" rule). A 2px surface gap separates segments instead of a
 * border, and the legend is always present since there's more than one series.
 */
export default function StackedBar({ segments, total }: { segments: StackedBarSegment[]; total: number }) {
  return (
    <div>
      <div className="flex h-[22px] gap-0.5 overflow-hidden rounded-md bg-border">
        {segments
          .filter((segment) => segment.value > 0)
          .map((segment) => (
            <div
              key={segment.label}
              className={`flex items-center justify-center text-[10.5px] font-bold whitespace-nowrap ${segment.colorClassName} ${segment.textClassName ?? "text-white"}`}
              style={{ width: `${total > 0 ? (segment.value / total) * 100 : 0}%` }}
            >
              {segment.value}
            </div>
          ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {segments.map((segment) => (
          <span key={segment.label} className="inline-flex items-center gap-1.5">
            <span className={`size-2.5 rounded-sm ${segment.colorClassName}`} />
            {segment.label} ({segment.value})
          </span>
        ))}
      </div>
    </div>
  );
}
