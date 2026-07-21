"use client";

import { Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { PublicFlashcard, QuizCategory, State, VehicleType } from "@driving-test-app/shared";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
import Paginator from "@/components/ui/Paginator";
import { api } from "@/lib/api";
import { WebLayoutProvider } from "@/lib/web-layout-context";
import { usePaginatedList } from "@/hooks/use-paginated-list";

function FlashcardPreviewCard({ card }: { card: PublicFlashcard }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-neutral-900">{card.front_text}</p>
        {card.locked && <Lock className="h-4 w-4 shrink-0 text-amber-600" />}
      </div>
      <p className="text-sm text-neutral-500">
        {card.category?.title}
        {card.state && ` · ${card.state.name}`}
        {card.vehicle_type && ` · ${card.vehicle_type.title}`}
      </p>
    </div>
  );
}

function FlashcardsBrowseInner() {
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

  const { data: flashcards } = usePaginatedList<PublicFlashcard>(`/flashcards${query ? `?${query}` : ""}`);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/flashcards?${params.toString()}`);
  }

  const rows = flashcards?.data ?? [];
  const studyHref = `/flashcards/study${query ? `?${query}` : ""}`;

  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" hideNav />
        <main className="flex-1">
          <div className="mx-auto max-w-container space-y-6 px-5 py-10 lg:py-14">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-neutral-900">Flashcards</h1>
                <p className="text-neutral-500">Quick recall practice for signs, rules, and terms.</p>
              </div>
              <Button href={studyHref}>Start studying</Button>
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
              <p className="py-10 text-center text-sm text-neutral-500">No flashcards match those filters.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((card) => (
                  <FlashcardPreviewCard key={card.id} card={card} />
                ))}
              </div>
            )}

            {flashcards && flashcards.meta.total > 0 && <Paginator meta={flashcards.meta} />}
          </div>
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}

export default function FlashcardsBrowsePage() {
  return (
    <Suspense>
      <FlashcardsBrowseInner />
    </Suspense>
  );
}
