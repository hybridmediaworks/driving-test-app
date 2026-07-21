"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { PublicFlashcard } from "@driving-test-app/shared";
import FlashcardDeck from "@/components/flashcards/FlashcardDeck";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { WebLayoutProvider } from "@/lib/web-layout-context";

function FlashcardStudyInner() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [cards, setCards] = useState<PublicFlashcard[] | null>(null);

  const query = searchParams.toString();

  useEffect(() => {
    api.get<{ data: PublicFlashcard[] }>(`/flashcards/study${query ? `?${query}` : ""}`).then((res) => setCards(res.data));
  }, [query]);

  function handleReview(card: PublicFlashcard, status: "known" | "unknown") {
    // Guests get an ephemeral, client-only shuffle — study progress is only persisted for
    // signed-in users (also matches the backend, which rejects an unauthenticated review call).
    if (!user) return;
    api.post(`/flashcards/${card.id}/review`, { status }).catch(() => {
      // Best-effort — a failed progress save shouldn't interrupt the study session.
    });
  }

  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" hideNav />
        <main className="flex-1">
          <div className="mx-auto max-w-2xl space-y-6 px-5 py-10 lg:py-14">
            <div className="space-y-1 text-center">
              <h1 className="text-2xl font-semibold text-neutral-900">Flashcard study</h1>
              {!user && (
                <p className="text-sm text-neutral-500">Sign in to save your progress across sessions.</p>
              )}
            </div>

            {cards === null ? (
              <p className="text-center text-sm text-neutral-500">Loading…</p>
            ) : (
              <FlashcardDeck cards={cards} onReview={handleReview} />
            )}
          </div>
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}

export default function FlashcardStudyPage() {
  return (
    <Suspense>
      <FlashcardStudyInner />
    </Suspense>
  );
}
