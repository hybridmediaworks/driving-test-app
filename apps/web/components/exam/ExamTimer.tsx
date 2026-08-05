"use client";

import { useEffect, useRef, useState } from "react";

export default function ExamTimer({
  durationSeconds,
  onExpire,
}: {
  durationSeconds: number;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // Runs once for the lifetime of this quiz attempt — onExpire is stable enough
    // in practice (it's the auto-submit handler) that re-subscribing on every render
    // would just restart the interval and desync the displayed time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationSeconds]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const urgent = remaining <= Math.max(durationSeconds * 0.2, 60);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold tabular-nums ${
        urgent ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"
      }`}
      role="timer"
      aria-live="polite"
    >
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")} left
    </div>
  );
}
