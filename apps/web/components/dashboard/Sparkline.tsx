/**
 * A trend sparkline — de-emphasis gray line, current-period endpoint in the accent color.
 * Needs at least 2 points to draw a line; renders nothing otherwise (a flat single value has
 * no trend to show).
 */
export default function Sparkline({ data, className = "h-[30px] w-full" }: { data: number[]; className?: string }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = 100 / (data.length - 1);
  const points = data.map((v, i) => ({ x: i * stepX, y: 26 - ((v - min) / range) * 22 }));
  const last = points[points.length - 1];

  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className={`block ${className}`}>
      <polyline
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        className="stroke-muted-foreground"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r="2.6" className="fill-chart-1" />
    </svg>
  );
}
