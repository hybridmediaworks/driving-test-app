"use client";

import { useState } from "react";
import type { PublicFlashcard } from "@driving-test-app/shared";
import Button from "@/components/ui/Button";
import Flashcard from "./Flashcard";

/**
 * Presentational study-session orchestrator — deliberately takes `cards` and `onReview` as props
 * rather than fetching internally, so the same component can later drive a "Weak Spots" deck fed
 * from quiz-attempt history instead of `/flashcards/study`, with zero changes here.
 */
export default function FlashcardDeck({
  cards,
  onReview,
  emptyMessage = "No flashcards match your filters yet.",
}: {
  cards: PublicFlashcard[];
  onReview?: (card: PublicFlashcard, status: "known" | "unknown") => void;
  emptyMessage?: string;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [unknownCount, setUnknownCount] = useState(0);

  if (cards.length === 0) {
    return <p className="py-10 text-center text-sm text-neutral-500">{emptyMessage}</p>;
  }

  if (index >= cards.length) {
    return (
      <div className="space-y-4 rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-neutral-900">Deck complete</h2>
        <p className="text-neutral-500">
          {knownCount} known · {unknownCount} still learning
        </p>
        <Button
          onClick={() => {
            setIndex(0);
            setFlipped(false);
            setKnownCount(0);
            setUnknownCount(0);
          }}
        >
          Study again
        </Button>
      </div>
    );
  }

  const card = cards[index];

  function advance() {
    setFlipped(false);
    setIndex((i) => i + 1);
  }

  function mark(status: "known" | "unknown") {
    onReview?.(card, status);
    if (status === "known") setKnownCount((c) => c + 1);
    else setUnknownCount((c) => c + 1);
    advance();
  }

  return (
    <div className="space-y-5">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${(index / cards.length) * 100}%` }}
        />
      </div>
      <p className="text-center text-sm text-neutral-500">
        Card {index + 1} of {cards.length}
      </p>

      <Flashcard card={card} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />

      {card.locked ? (
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={advance}>Skip</Button>
          <Button href="/pricing">Upgrade to unlock</Button>
        </div>
      ) : flipped ? (
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => mark("unknown")}>Still learning</Button>
          <Button onClick={() => mark("known")}>I knew it</Button>
        </div>
      ) : (
        <div className="flex justify-center">
          <Button variant="outline" onClick={advance}>Skip</Button>
        </div>
      )}
    </div>
  );
}
