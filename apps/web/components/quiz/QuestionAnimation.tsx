"use client";

import { Player } from "@lottiefiles/react-lottie-player";
import type { PublicQuizQuestionAsset } from "@driving-test-app/shared";

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
