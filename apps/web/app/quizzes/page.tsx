"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { PublicQuiz, QuizCategory, State, VehicleType } from "@driving-test-app/shared";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import QuizCard from "@/components/quiz/QuizCard";
import Paginator from "@/components/ui/Paginator";
import { api } from "@/lib/api";
import { WebLayoutProvider } from "@/lib/web-layout-context";
import { usePaginatedList } from "@/hooks/use-paginated-list";

function QuizzesBrowseInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  const [states, setStates] = useState<State[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [categories, setCategories] = useState<QuizCategory[]>([]);

  useEffect(() => {
    api.get<{ data: State[] }>("/states").then((res) => setStates(res.data));
    api.get<{ data: VehicleType[] }>("/vehicle-types").then((res) => setVehicleTypes(res.data));
    api.get<{ data: QuizCategory[] }>("/quiz-categories").then((res) => setCategories(res.data));
  }, []);

  const { data: quizzes } = usePaginatedList<PublicQuiz>(`/quizzes${query ? `?${query}` : ""}`);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/quizzes?${params.toString()}`);
  }

  const rows = quizzes?.data ?? [];

  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" hideNav />
        <main className="flex-1">
          <div className="mx-auto max-w-container space-y-6 px-5 py-10 lg:py-14">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-neutral-900">Practice tests</h1>
              <p className="text-neutral-500">Free to take — no account required. Sign up to save your results.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <select
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
                value={searchParams.get("state") ?? ""}
                onChange={(e) => updateFilter("state", e.target.value)}
              >
                <option value="">All states</option>
                {states.map((s) => (
                  <option key={s.id} value={s.code}>{s.name}</option>
                ))}
              </select>
              <select
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
                value={searchParams.get("vehicle_type") ?? ""}
                onChange={(e) => updateFilter("vehicle_type", e.target.value)}
              >
                <option value="">All vehicle types</option>
                {vehicleTypes.map((v) => (
                  <option key={v.id} value={v.name}>{v.title}</option>
                ))}
              </select>
              <select
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
                value={searchParams.get("category") ?? ""}
                onChange={(e) => updateFilter("category", e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.title}</option>
                ))}
              </select>
            </div>

            {rows.length === 0 ? (
              <p className="py-10 text-center text-sm text-neutral-500">No quizzes match those filters.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} />
                ))}
              </div>
            )}

            {quizzes && quizzes.meta.total > 0 && <Paginator meta={quizzes.meta} />}
          </div>
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}

export default function QuizzesBrowsePage() {
  return (
    <Suspense>
      <QuizzesBrowseInner />
    </Suspense>
  );
}
