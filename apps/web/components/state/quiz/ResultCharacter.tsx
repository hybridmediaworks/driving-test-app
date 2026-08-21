"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// lottie-web (used by react-lottie-player) touches `document` at import time, which crashes
// Next.js's server-side prerendering — load it client-only, same as QuestionAnimation.tsx.
const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  { ssr: false },
);

/**
 * Results-screen character.
 *
 * When `lottieSrc` is set (a URL or a path under /public) an animated Lottie character is played —
 * e.g. drop a police-officer animation at /public/lottie/result-officer.json. The character stays
 * planted (no whole-body float) so it reads as "standing behind the card, waving" — the wave lives
 * inside the Lottie itself. If the asset is missing or fails to load it gracefully falls back to a
 * static emoji "coach" (Apple renders these as full illustrations), so there is never a blank.
 */
export default function ResultCharacter({
  emoji,
  lottieSrc,
  className = "text-[110px] leading-none",
}: {
  emoji: string;
  lottieSrc?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (lottieSrc && !failed) {
    return (
      <Player
        src={lottieSrc}
        autoplay
        loop
        keepLastFrame
        onEvent={(event) => {
          if (String(event) === "error") setFailed(true);
        }}
        className="h-52 w-52 select-none"
      />
    );
  }

  return (
    <div className={`select-none drop-shadow-sm ${className}`} aria-hidden>
      {emoji}
    </div>
  );
}
