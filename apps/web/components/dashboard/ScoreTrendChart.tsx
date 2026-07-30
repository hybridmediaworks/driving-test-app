"use client";

import { useMemo, useState } from "react";

const WIDTH = 560;
const HEIGHT = 200;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;
const TICKS = [0, 25, 50, 75, 100];

/**
 * A single-series score trend — 2px line, ~10% area wash, endpoint marker, and a crosshair +
 * tooltip hit-column per point (see the dataviz skill's interaction spec). Every value shown on
 * hover is also reachable through the "view as table" toggle, so nothing is hover-gated.
 */
export default function ScoreTrendChart({ scores }: { scores: number[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const points = useMemo(
    () =>
      scores.map((score, i) => ({
        x: PAD_LEFT + (scores.length === 1 ? plotWidth / 2 : (i / (scores.length - 1)) * plotWidth),
        y: PAD_TOP + plotHeight - (Math.max(0, Math.min(100, score)) / 100) * plotHeight,
        score,
      })),
    [scores, plotWidth, plotHeight],
  );

  if (scores.length === 0) {
    return <p className="text-sm text-muted-foreground">No completed attempts yet.</p>;
  }

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = `M${points[0].x},${PAD_TOP + plotHeight} L${points.map((p) => `${p.x},${p.y}`).join(" L")} L${points[points.length - 1].x},${PAD_TOP + plotHeight} Z`;
  const last = points[points.length - 1];
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const hitColWidth = plotWidth / points.length;

  return (
    <div>
      <div className="relative">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="block h-[200px] w-full overflow-visible">
          {TICKS.map((tick) => {
            const y = PAD_TOP + plotHeight - (tick / 100) * plotHeight;
            return (
              <g key={tick}>
                <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y} y2={y} className="stroke-chart-grid" strokeWidth="1" />
                <text x={0} y={y - 3} fontSize="10" className="fill-muted-foreground">
                  {tick}
                </text>
              </g>
            );
          })}

          <path d={areaPath} className="fill-chart-wash" />
          <polyline points={linePoints} fill="none" className="stroke-chart-1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === points.length - 1 ? 5 : 3.5}
              className={i === points.length - 1 ? "fill-chart-1 stroke-card" : "fill-card stroke-chart-1"}
              strokeWidth="2"
            />
          ))}

          {hovered && (
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={PAD_TOP}
              y2={PAD_TOP + plotHeight}
              className="stroke-muted-foreground"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}

          {points.map((p, i) => (
            <rect
              key={i}
              x={PAD_LEFT + i * hitColWidth}
              y={PAD_TOP}
              width={hitColWidth}
              height={plotHeight}
              fill="transparent"
              tabIndex={0}
              onPointerEnter={() => setHoverIndex(i)}
              onPointerMove={() => setHoverIndex(i)}
              onPointerLeave={() => setHoverIndex(null)}
              onFocus={() => setHoverIndex(i)}
              onBlur={() => setHoverIndex(null)}
            />
          ))}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[120%] rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-background"
            style={{ left: `${(hovered.x / WIDTH) * 100}%`, top: `${(hovered.y / HEIGHT) * 100}%` }}
          >
            Attempt {hoverIndex! + 1} — {hovered.score}%
          </div>
        )}

        <div
          className="pointer-events-none absolute rounded bg-card px-1 text-xs font-bold text-chart-1"
          style={{ left: `calc(${(last.x / WIDTH) * 100}% - 14px)`, top: `calc(${(last.y / HEIGHT) * 100}% - 22px)` }}
        >
          {last.score}%
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowTable((v) => !v)}
        className="mt-2 text-[11.5px] font-semibold text-blue-primary underline underline-offset-2"
      >
        {showTable ? "Hide table" : "View as table"}
      </button>

      {showTable && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1 pr-4 font-medium">Attempt</th>
                <th className="py-1 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="py-1 pr-4">Attempt {i + 1}</td>
                  <td className="py-1 tabular-nums">{score}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
