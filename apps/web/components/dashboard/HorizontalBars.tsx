export type HorizontalBarRow = {
  label: string;
  value: number;
  /** Rendered next to the value in the critical status color — e.g. "Focus here". */
  flag?: string;
  /** Tailwind background utility for the fill. Defaults to the sequential brand hue. */
  colorClassName?: string;
};

/**
 * Magnitude comparison, low → high — sequential single hue by default (see the dataviz skill's
 * "compare magnitude" job). A minimum fill width keeps small values visible; the printed value is
 * still the source of truth.
 */
export default function HorizontalBars({
  rows,
  max,
  valueSuffix = "",
}: {
  rows: HorizontalBarRow[];
  max: number;
  valueSuffix?: string;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[minmax(0,150px)_1fr_auto] items-center gap-2.5">
          <span className="truncate text-[12.5px] text-muted-foreground">{row.label}</span>
          <div className="h-3 rounded bg-border">
            <div
              className={`h-full rounded ${row.colorClassName ?? "bg-chart-1"}`}
              style={{ width: `${max > 0 ? Math.max((row.value / max) * 100, 2.5) : 0}%` }}
            />
          </div>
          <span className="flex items-center justify-end gap-2 text-[12.5px] font-semibold tabular-nums whitespace-nowrap">
            {row.value}
            {valueSuffix}
            {row.flag && (
              <span className="rounded-full bg-status-critical-wash px-2 py-0.5 text-[10.5px] font-bold text-status-critical">
                {row.flag}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
