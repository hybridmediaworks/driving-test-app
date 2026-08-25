"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PaginatedResponse, PublicQuiz, QuizShowResponse } from "@driving-test-app/shared";
import QuizExperience from "@/components/state/quiz/QuizExperience";
import { api, ApiError } from "@/lib/api";
import { isValidState, slugToStateName, stateAbbreviations } from "@/lib/usStates";
import { useWebLayout, WebLayoutProvider } from "@/lib/web-layout-context";

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

function QuizPageInner({ state, testSlug }: { state: string; testSlug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // "?view=results" (from the detail page's "View results" button) opens the player straight on the
  // last attempt's results instead of starting a fresh quiz.
  const initialView = searchParams.get("view") === "results" ? "results" : undefined;
  const { selectedVehicle } = useWebLayout();
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";

  const stateNameCandidate = slugToStateName(state);
  const stateName = isValidState(stateNameCandidate) ? stateNameCandidate : "Alaska";
  const stateCode = stateAbbreviations[stateName];

  const [quiz, setQuiz] = useState<PublicQuiz | null | undefined>(undefined);
  const [locked, setLocked] = useState(false);
  const [data, setData] = useState<QuizShowResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Resolve the real quiz id from the state+vehicle+slug in the URL, then fetch it.
  useEffect(() => {
    let cancelled = false;

    api
      .get<PaginatedResponse<PublicQuiz>>(`/quizzes?state=${stateCode}&vehicle_type=${vehicleType}&slug=${testSlug}`)
      .then((res) => {
        if (cancelled) return;
        const found = res.data[0];
        setQuiz(found ?? null);
        if (!found) return;

        return api.get<QuizShowResponse>(`/quizzes/${found.id}`).then((showRes) => {
          if (cancelled) return;
          setData(showRes);
          setLocked(showRes.locked);
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : "This test isn't available right now.");
        setQuiz(null);
      });

    return () => {
      cancelled = true;
    };
  }, [stateCode, vehicleType, testSlug]);

  // Continue → the next quiz in the SAME category (e.g. "The Essentials" → Practice Test 1 → 2),
  // ordered by the API's order_no. A free/unlocked next quiz opens directly; a premium next quiz
  // the user isn't entitled to sends them to pricing; no next quiz falls back to the state page.
  async function goToNextQuiz() {
    if (!quiz) return router.push(`/${state}/${testSlug}`);
    try {
      const categoryParam = quiz.category?.name
        ? `&category=${encodeURIComponent(quiz.category.name)}`
        : "";
      const res = await api.get<PaginatedResponse<PublicQuiz>>(
        `/quizzes?state=${stateCode}&vehicle_type=${vehicleType}${categoryParam}&per_page=100`,
      );
      const list = res.data;
      const idx = list.findIndex((q) => q.id === quiz.id);
      const next = idx >= 0 ? list[idx + 1] : undefined;

      if (!next) {
        router.push(`/${state}`); // last quiz in this category — back to the state overview
      } else if (next.locked) {
        router.push("/pricing");
      } else {
        router.push(`/${state}/${next.slug}`);
      }
    } catch {
      router.push(`/${state}/${testSlug}`);
    }
  }

  return (
    <QuizExperience
      quiz={quiz}
      data={data}
      locked={locked}
      loadError={loadError}
      title={quiz ? `${stateName} ${quiz.title}` : ""}
      notFoundHref={`/${state}`}
      notFoundLabel={`Back to ${stateName}`}
      exitHref={`/${state}/${testSlug}`}
      stateName={stateName}
      stateCode={stateCode}
      onContinue={goToNextQuiz}
      initialView={initialView}
    />
  );
}

export default function TestQuizPage({
  params,
}: {
  params: Promise<{ state: string; "test-slug": string }>;
}) {
  const { state, "test-slug": testSlug } = use(params);

  return (
    <WebLayoutProvider stateSlug={state}>
      {/* Suspense boundary required by useSearchParams (read inside QuizPageInner). */}
      <Suspense>
        {/* key by slug so moving to another quiz (Continue → next) starts with a clean state. */}
        <QuizPageInner key={testSlug} state={state} testSlug={testSlug} />
      </Suspense>
    </WebLayoutProvider>
  );
}
