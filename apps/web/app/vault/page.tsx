"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";
import Paragraph from "@/components/ui/Paragraph";
import QuizVaultDrill from "@/components/dashboard/QuizVaultDrill";
import { useEntitlement } from "@/lib/auth-context";
import { useChallengeBank } from "@/lib/useChallengeBank";

/**
 * The vault IS the drill — opening it starts practising, in the quiz's own frame and without the
 * dashboard chrome, the same as starting any other test. There is no list to read first.
 * `?list=bookmarked` practises the saved questions instead of the missed ones.
 *
 * Premium only. Anyone else is sent to the plans page rather than shown an empty vault, which is the
 * same place the bookmark sends them in the middle of a quiz.
 *
 * Lives at /vault, not under /dashboard: it is a test to sit, not a dashboard screen, and it renders
 * without the dashboard chrome.
 */
function Practice() {
  const params = useSearchParams();
  const router = useRouter();
  const list = params.get("list") === "bookmarked" ? "bookmarked" : "missed";
  const { isPremium, loading: authLoading } = useEntitlement();
  const { questions, loading } = useChallengeBank();

  useEffect(() => {
    if (!authLoading && !isPremium) router.replace("/pricing");
  }, [authLoading, isPremium, router]);

  // Snapshot once the fetch lands: the drill owns its queue from then on, and refetching behind it
  // would shuffle the run under the learner's feet.
  const forDrill = useMemo(
    () =>
      questions.filter((q) => (list === "missed" ? q.missed : q.bookmarked)),
    [questions, list],
  );

  if (authLoading || !isPremium || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Paragraph color="muted">Opening your vault…</Paragraph>
      </div>
    );
  }

  if (forDrill.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-5 text-center">
        <Paragraph size="2xl" color="dark" className="font-sora font-semibold">
          Nothing to practise
        </Paragraph>
        <Paragraph color="muted">
          {list === "missed"
            ? "You have not missed anything yet."
            : "You have not saved any questions yet."}
        </Paragraph>
      </div>
    );
  }

  return (
    <QuizVaultDrill
      key={list}
      questions={forDrill}
      title={list === "missed" ? "Quiz Vault · Missed" : "Quiz Vault · Saved"}
      fallbackExitHref="/dashboard"
    />
  );
}

export default function QuizVaultPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <Practice />
      </Suspense>
    </main>
  );
}
