"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { PaginatedResponse, Quiz, QuizCategory, QuizType, State, VehicleType } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import Paginator from "@/components/ui/Paginator";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useDeleteConfirm } from "@/hooks/use-paginated-list";

type QuizzesResponse = {
  quizzes: PaginatedResponse<Quiz>;
  categories: Pick<QuizCategory, "id" | "name" | "title">[];
  quiz_types: QuizType[];
  states: State[];
  vehicle_types: Pick<VehicleType, "id" | "name" | "title">[];
  filters: Record<string, string | boolean | null>;
};

function QuizzesIndexInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [res, setRes] = useState<QuizzesResponse | null>(null);

  const query = searchParams.toString();

  function load() {
    api.get<QuizzesResponse>(`/admin/quizzes${query ? `?${query}` : ""}`).then(setRes);
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
    router.replace(`/admin/quizzes?${params.toString()}`);
  }

  const del = useDeleteConfirm<Quiz>((q) => api.delete(`/admin/quizzes/${q.id}`), load, "Failed to delete quiz.");

  const rows = res?.quizzes.data ?? [];

  return (
    <AdminGuard>
      <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Quizzes", href: "/admin/quizzes" }]}>
        <div className="app-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-0.5">
              <h1 className="text-lg font-semibold">Quizzes</h1>
              <p className="text-sm text-muted-foreground">Practice, marathon, and exam quizzes by category</p>
            </div>
            <Button className="w-full shrink-0 sm:w-auto" render={<Link href="/admin/quizzes/create" />}>
              New quiz
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end lg:grid-cols-3 xl:flex xl:flex-row xl:flex-wrap">
            <div className="flex w-full flex-col gap-1 sm:max-w-xs lg:max-w-none xl:max-w-[13rem]">
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
            <div className="flex w-full flex-col gap-1 sm:max-w-xs lg:max-w-none xl:max-w-[13rem]">
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
            <div className="flex w-full flex-col gap-1 sm:max-w-xs lg:max-w-none xl:max-w-[13rem]">
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
            <div className="flex w-full flex-col gap-1 sm:max-w-xs lg:max-w-none xl:max-w-[13rem]">
              <label className="text-sm font-medium" htmlFor="f-type">Type</label>
              <select
                id="f-type"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={searchParams.get("quiz_type_id") ?? ""}
                onChange={(e) => updateFilter("quiz_type_id", e.target.value)}
              >
                <option value="">All</option>
                {res?.quiz_types.map((t) => (
                  <option key={t.id} value={String(t.id)}>{t.title}</option>
                ))}
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-2 self-center text-sm sm:col-span-2 lg:col-span-3 xl:col-auto xl:self-end">
              <input
                type="checkbox"
                checked={searchParams.get("active_only") === "1"}
                onChange={(e) => updateFilter("active_only", e.target.checked ? "1" : "")}
              />
              Active only
            </label>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                All quizzes <span className="font-normal text-muted-foreground">({res?.quizzes.meta.total ?? 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No quizzes yet. Create a category first, then add a quiz.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {rows.map((q) => (
                    <li key={q.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 gap-3">
                        {q.cover_image_url && (
                          <div className="shrink-0 overflow-hidden rounded-md border border-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={q.cover_image_url} alt="" className="size-12 object-cover sm:size-16" />
                          </div>
                        )}
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{q.title}</span>
                            {q.is_premium ? (
                              <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-800">Premium</span>
                            ) : (
                              <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Free</span>
                            )}
                            {q.is_active ? (
                              <span className="text-xs text-muted-foreground">Active</span>
                            ) : (
                              <span className="text-xs text-neutral-500">Inactive</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Order {q.order_no ?? 0} · {q.category?.title} · {q.quiz_type?.title}
                            {q.state && ` · ${q.state.name}`}
                            {q.vehicle_type && ` · ${q.vehicle_type.title}`}
                            {` · ${q.test_track === "permit_test" ? "Permit Test" : "Driving Test"}`}
                            {` · ${q.total_questions} questions`}
                            {q.duration_seconds && ` · ${Math.round(q.duration_seconds / 60)} min`}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">/{q.slug}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" render={<Link href={`/admin/quizzes/${q.id}/questions`} />}>
                          Questions
                        </Button>
                        <Button variant="outline" size="sm" render={<Link href={`/admin/quizzes/${q.id}/edit`} />}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => del.request(q)}>
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {res && res.quizzes.meta.total > 0 && <Paginator meta={res.quizzes.meta} />}
            </CardContent>
          </Card>

          <ConfirmDeleteDialog
            open={del.open}
            onOpenChange={del.setOpen}
            title="Delete quiz?"
            description={
              del.error ??
              (del.target ? `Are you sure you want to delete "${del.target.title}"? All questions in this quiz will be removed. This cannot be undone.` : "")
            }
            onConfirm={del.confirm}
          />
        </div>
      </AppLayout>
    </AdminGuard>
  );
}

export default function QuizzesIndexPage() {
  return (
    <Suspense>
      <QuizzesIndexInner />
    </Suspense>
  );
}
