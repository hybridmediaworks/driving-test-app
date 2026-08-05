"use client";

import { useEffect, useState } from "react";
import type { PaginatedResponse, PublicQuiz, QuizCategory } from "@driving-test-app/shared";
import { api } from "@/lib/api";

const vehicleTypeNameMap: Record<string, string> = {
  Car: "car",
  CDL: "cdl",
  Motorcycle: "motorcycle",
};

// The "ladder" categories rendered as sections on the state landing page, in display order —
// distinct from the topic categories (road-signs, traffic-laws, ...) used by the generic
// /quizzes browse page.
const LADDER_CATEGORY_NAMES = [
  "the-essentials",
  "the-more-complicated-stuff",
  "things-that-could-get-you-in-trouble",
  "the-extra-support",
];

export type StateQuizSection = {
  category: QuizCategory;
  quizzes: PublicQuiz[];
};

export function useStateQuizzes({
  stateCode,
  vehicleType,
  testTrack,
}: {
  stateCode: string;
  vehicleType: string;
  testTrack: string;
}) {
  const [sections, setSections] = useState<StateQuizSection[]>([]);
  const [examSimulatorQuizzes, setExamSimulatorQuizzes] = useState<PublicQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stateCode) return;
    let cancelled = false;

    const vehicleTypeName = vehicleTypeNameMap[vehicleType] ?? "car";

    const listParams = new URLSearchParams({
      state: stateCode,
      vehicle_type: vehicleTypeName,
      test_track: testTrack,
      per_page: "100",
    });
    const examParams = new URLSearchParams({
      state: stateCode,
      vehicle_type: vehicleTypeName,
      quiz_type: "final",
      per_page: "100",
    });

    Promise.all([
      api.get<{ data: QuizCategory[] }>("/quiz-categories"),
      api.get<PaginatedResponse<PublicQuiz>>(`/quizzes?${listParams.toString()}`),
      api.get<PaginatedResponse<PublicQuiz>>(`/quizzes?${examParams.toString()}`),
    ]).then(([categoriesRes, quizzesRes, examRes]) => {
      if (cancelled) return;

      const quizzesByCategory = new Map<number, PublicQuiz[]>();
      for (const quiz of quizzesRes.data) {
        if (!quiz.category) continue;
        const list = quizzesByCategory.get(quiz.category.id) ?? [];
        list.push(quiz);
        quizzesByCategory.set(quiz.category.id, list);
      }

      const categoriesByName = new Map(categoriesRes.data.map((category) => [category.name, category]));
      const nextSections = LADDER_CATEGORY_NAMES.map((name) => categoriesByName.get(name))
        .filter((category): category is QuizCategory => !!category)
        .map((category) => ({ category, quizzes: quizzesByCategory.get(category.id) ?? [] }));

      setSections(nextSections);
      setExamSimulatorQuizzes(examRes.data);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [stateCode, vehicleType, testTrack]);

  return { sections, examSimulatorQuizzes, loading };
}
