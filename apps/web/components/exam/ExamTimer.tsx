export default function ExamTimer({
  durationSeconds,
  remainingSeconds,
}: {
  durationSeconds: number;
  remainingSeconds: number;
}) {
  const remaining = Math.max(remainingSeconds, 0);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const urgent = remaining <= Math.max(durationSeconds * 0.2, 60);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold tabular-nums ${
        urgent ? "bg-red-50 text-red-600" : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300"
      }`}
      role="timer"
      aria-live="polite"
    >
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")} left
    </div>
  );
}
