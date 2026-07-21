"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { PublicCheatSheet, QuizCategory, State, VehicleType } from "@driving-test-app/shared";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Paginator from "@/components/ui/Paginator";
import { api } from "@/lib/api";
import { WebLayoutProvider } from "@/lib/web-layout-context";
import { usePaginatedList } from "@/hooks/use-paginated-list";

function CheatSheetCard({ sheet }: { sheet: PublicCheatSheet }) {
  return (
    <Link
      href={`/cheat-sheets/${sheet.id}`}
      className="flex flex-col gap-3 rounded-2xl border border-gray-100 p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      {sheet.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={sheet.cover_image_url} alt="" className="h-32 w-full rounded-xl object-cover" />
      )}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-neutral-900">{sheet.title}</h3>
        {sheet.is_premium && <Lock className="h-4 w-4 shrink-0 text-amber-600" />}
      </div>
      <p className="text-sm text-neutral-500">{sheet.summary}</p>
      <p className="text-xs text-neutral-400">
        {sheet.category?.title}
        {sheet.state && ` · ${sheet.state.name}`}
        {sheet.vehicle_type && ` · ${sheet.vehicle_type.title}`}
      </p>
    </Link>
  );
}

function CheatSheetsBrowseInner() {
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

  const { data: cheatSheets } = usePaginatedList<PublicCheatSheet>(`/cheat-sheets${query ? `?${query}` : ""}`);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/cheat-sheets?${params.toString()}`);
  }

  const rows = cheatSheets?.data ?? [];

  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" hideNav />
        <main className="flex-1">
          <div className="mx-auto max-w-container space-y-6 px-5 py-10 lg:py-14">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-neutral-900">Cheat sheets</h1>
              <p className="text-neutral-500">Condensed, high-yield study guides — read online or download as PDF.</p>
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
              <p className="py-10 text-center text-sm text-neutral-500">No cheat sheets match those filters.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((sheet) => (
                  <CheatSheetCard key={sheet.id} sheet={sheet} />
                ))}
              </div>
            )}

            {cheatSheets && cheatSheets.meta.total > 0 && <Paginator meta={cheatSheets.meta} />}
          </div>
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}

export default function CheatSheetsBrowsePage() {
  return (
    <Suspense>
      <CheatSheetsBrowseInner />
    </Suspense>
  );
}
