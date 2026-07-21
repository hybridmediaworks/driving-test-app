"use client";

import { Lock } from "lucide-react";
import type { PublicFlashcard } from "@driving-test-app/shared";

export default function Flashcard({
  card,
  flipped,
  onFlip,
}: {
  card: PublicFlashcard;
  flipped: boolean;
  onFlip: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onFlip}
      className="relative h-80 w-full cursor-pointer text-left [perspective:1200px]"
      aria-label={flipped ? "Show front" : "Show back"}
    >
      <div
        className="relative h-full w-full rounded-3xl transition-transform duration-500 [transform-style:preserve-3d]"
        style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        {/* Front */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm [backface-visibility:hidden]">
          {card.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.image_url} alt="" className="max-h-32 object-contain" />
          )}
          <p className="text-lg font-semibold text-neutral-900">{card.front_text}</p>
          <p className="text-xs text-neutral-400">Tap to flip</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl border border-blue-100 bg-blue-50 p-8 text-center shadow-sm [backface-visibility:hidden]"
          style={{ transform: "rotateY(180deg)" }}
        >
          {card.locked ? (
            <>
              <Lock className="h-8 w-8 text-amber-600" />
              <p className="text-sm font-semibold text-neutral-900">Premium card</p>
              <p className="text-sm text-neutral-500">Upgrade to see the answer.</p>
            </>
          ) : (
            <p className="text-base text-neutral-800">{card.back_text}</p>
          )}
        </div>
      </div>
    </button>
  );
}
