export default function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  className = "",
}: {
  value: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (value: number[]) => void;
  className?: string;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={(e) => onValueChange([Number(e.target.value)])}
      className={`h-1.5 cursor-pointer appearance-none rounded-full bg-neutral-200 accent-blue-primary ${className}`}
    />
  );
}
