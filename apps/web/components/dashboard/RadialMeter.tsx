/**
 * A ratio-against-a-limit meter — same-ramp track (unfilled track is a lighter step of the
 * fill's own hue), per the dataviz skill's "Meter" form.
 */
export default function RadialMeter({
  percent,
  centerValue,
  centerCaption,
  size = 148,
}: {
  percent: number;
  centerValue: string;
  centerCaption?: string;
  size?: number;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" className="stroke-chart-track" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          className="stroke-chart-1"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[30px] leading-none font-semibold tracking-tight">{centerValue}</span>
        {centerCaption && <span className="mt-1.5 text-[11.5px] text-muted-foreground">{centerCaption}</span>}
      </div>
    </div>
  );
}
