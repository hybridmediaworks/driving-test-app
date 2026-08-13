"use client";

import dynamic from "next/dynamic";
import type { PublicQuizQuestionAsset } from "@driving-test-app/shared";

// lottie-web (used by react-lottie-player) touches `document` at module import time, which
// crashes Next.js's server-side prerendering — load it client-only.
const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  { ssr: false },
);

/**
 * "Road situation" questions (e.g. the Virtual 360° Road Situations quizzes) attach a Lottie
 * vector animation instead of a static photo — rendered client-side from the raw animation JSON
 * URL, same as the source site does.
 */
export default function QuestionAnimation({
  asset,
  className = "max-h-64 w-full rounded-xl bg-neutral-50 object-cover",
}: {
  asset: PublicQuizQuestionAsset;
  className?: string;
}) {
  if (!asset.url) return null;

  return <Player src={asset.url} autoplay loop keepLastFrame className={className} />;
}
