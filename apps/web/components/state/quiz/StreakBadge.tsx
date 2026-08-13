// A short, escalating hype line to pair with the streak count.
function streakPhrase(streak: number): string {
  if (streak >= 10) return "Legendary!";
  if (streak >= 7) return "Unstoppable!";
  if (streak >= 5) return "On fire!";
  if (streak >= 3) return "You're on a roll!";
  return "Nice streak!";
}

/**
 * Live "on a roll" streak indicator, centered in the bottom action bar. Re-keyed by the parent on
 * every increment so the pop animation replays each time the streak grows.
 */
export default function StreakBadge({ streak }: { streak: number }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:block">
      <div className="streak-pop flex items-center gap-2 rounded-full bg-linear-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-bold text-white shadow-[0_10px_28px_-8px_rgba(249,115,22,0.7)]">
        <span className="text-base leading-none">🔥</span>
        <span>{streak} in a row</span>
        <span className="font-semibold text-white/85">· {streakPhrase(streak)}</span>
      </div>
    </div>
  );
}
