"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { Flashcard, PaginatedResponse, QuizCategory, State, VehicleType } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Paginator from "@/components/ui/Paginator";
import { api } from "@/lib/api";
import { useDeleteConfirm } from "@/hooks/use-paginated-list";

type FlashcardsResponse = {
  flashcards: PaginatedResponse<Flashcard>;
  categories: Pick<QuizCategory, "id" | "name" | "title">[];
  states: State[];
  vehicle_types: Pick<VehicleType, "id" | "name" | "title">[];
};

function FlashcardsIndexInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [res, setRes] = useState<FlashcardsResponse | null>(null);

  const query = searchParams.toString();

  function load() {
    api.get<FlashcardsResponse>(`/admin/flashcards${query ? `?${query}` : ""}`).then(setRes);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/admin/flashcards?${params.toString()}`);
  }

  const del = useDeleteConfirm<Flashcard>((c) => api.delete(`/admin/flashcards/${c.id}`), load, "Failed to delete flashcard.");

  const rows = res?.flashcards.data ?? [];

  return (
    <AdminGuard>
      <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Flashcards", href: "/admin/flashcards" }]}>
        <div className="app-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-0.5">
              <h1 className="text-lg font-semibold">Flashcards</h1>
              <p className="text-sm text-muted-foreground">Quick-recall study cards by category, state, and vehicle type</p>
            </div>
            <Button className="w-full shrink-0 sm:w-auto" render={<Link href="/admin/flashcards/create" />}>
              New flashcard
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end lg:grid-cols-3">
            <div className="flex w-full flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="f-cat">Category</label>
              <select
                id="f-cat"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={searchParams.get("quiz_category_id") ?? ""}
                onChange={(e) => updateFilter("quiz_category_id", e.target.value)}
              >
                <option value="">All</option>
                {res?.categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.title}</option>
                ))}
              </select>
            </div>
            <div className="flex w-full flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="f-state">State</label>
              <select
                id="f-state"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={searchParams.get("state_id") ?? ""}
                onChange={(e) => updateFilter("state_id", e.target.value)}
              >
                <option value="">All</option>
                {res?.states.map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div className="flex w-full flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="f-vehicle">Vehicle</label>
              <select
                id="f-vehicle"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={searchParams.get("vehicle_type_id") ?? ""}
                onChange={(e) => updateFilter("vehicle_type_id", e.target.value)}
              >
                <option value="">All</option>
                {res?.vehicle_types.map((v) => (
                  <option key={v.id} value={String(v.id)}>{v.title}</option>
                ))}
              </select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                All flashcards <span className="font-normal text-muted-foreground">({res?.flashcards.meta.total ?? 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No flashcards yet.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {rows.map((c) => (
                    <li key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 gap-3">
                        {c.image_url && (
                          <div className="shrink-0 overflow-hidden rounded-md border border-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={c.image_url} alt="" className="size-12 object-cover sm:size-16" />
                          </div>
                        )}
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{c.front_text}</span>
                            {c.is_premium ? (
                              <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-800">Premium</span>
                            ) : (
                              <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Free</span>
                            )}
                            {!c.is_active && <span className="text-xs text-neutral-500">Inactive</span>}
                          </div>
                          <p className="line-clamp-1 text-sm text-muted-foreground">{c.back_text}</p>
                          <p className="text-xs text-muted-foreground">
                            Order {c.sort_order} · {c.category?.title ?? "Any category"}
                            {c.state ? ` · ${c.state.name}` : " · All states"}
                            {c.vehicle_type ? ` · ${c.vehicle_type.title}` : " · All vehicles"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" render={<Link href={`/admin/flashcards/${c.id}/edit`} />}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => del.request(c)}>
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {res && res.flashcards.meta.total > 0 && <Paginator meta={res.flashcards.meta} />}
            </CardContent>
          </Card>

          <ConfirmDeleteDialog
            open={del.open}
            onOpenChange={del.setOpen}
            title="Delete flashcard?"
            description={
              del.error ??
              (del.target ? `Are you sure you want to delete "${del.target.front_text}"? This cannot be undone.` : "")
            }
            onConfirm={del.confirm}
          />
        </div>
      </AppLayout>
    </AdminGuard>
  );
}

export default function FlashcardsIndexPage() {
  return (
    <Suspense>
      <FlashcardsIndexInner />
    </Suspense>
  );
}
