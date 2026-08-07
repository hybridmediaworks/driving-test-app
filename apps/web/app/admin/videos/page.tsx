"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import type { PaginatedResponse, QuizCategory, State, VehicleType, Video } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Paginator from "@/components/ui/Paginator";
import { api } from "@/lib/api";
import { useDeleteConfirm, useUrlQuery } from "@/hooks/use-paginated-list";

type VideosResponse = {
  videos: PaginatedResponse<Video>;
  categories: Pick<QuizCategory, "id" | "name" | "title">[];
  states: State[];
  vehicle_types: Pick<VehicleType, "id" | "name" | "title">[];
};

function VideosIndexInner() {
  const { searchParams, updateFilter, setPage } = useUrlQuery();
  const [res, setRes] = useState<VideosResponse | null>(null);

  const query = searchParams.toString();

  function load() {
    api.get<VideosResponse>(`/admin/videos${query ? `?${query}` : ""}`).then(setRes);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const del = useDeleteConfirm<Video>((v) => api.delete(`/admin/videos/${v.id}`), load, "Failed to delete video.");

  const rows = res?.videos.data ?? [];

  return (
    <AdminGuard>
      <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Videos", href: "/admin/videos" }]}>
        <div className="app-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-0.5">
              <h1 className="text-lg font-semibold">Videos</h1>
              <p className="text-sm text-muted-foreground">Instructional videos by category, state, and vehicle type</p>
            </div>
            <Button className="w-full shrink-0 sm:w-auto" render={<Link href="/admin/videos/create" />}>
              New video
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
            <label className="flex cursor-pointer items-center gap-2 self-center text-sm sm:col-span-2 lg:col-span-3">
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
                All videos <span className="font-normal text-muted-foreground">({res?.videos.meta.total ?? 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No videos yet.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {rows.map((v) => (
                    <li key={v.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 gap-3">
                        {v.thumbnail_url && (
                          <div className="shrink-0 overflow-hidden rounded-md border border-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={v.thumbnail_url} alt="" className="size-12 object-cover sm:size-16" />
                          </div>
                        )}
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{v.title}</span>
                            {v.is_premium ? (
                              <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-800">Premium</span>
                            ) : (
                              <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Free</span>
                            )}
                            {!v.is_active && <span className="text-xs text-neutral-500">Inactive</span>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Order {v.order_no} · {v.category?.title ?? "Any category"}
                            {v.state ? ` · ${v.state.name}` : " · All states"}
                            {v.vehicle_type ? ` · ${v.vehicle_type.title}` : " · All vehicles"}
                            {v.test_track && ` · ${v.test_track === "permit_test" ? "Permit Test" : "Driving Test"}`}
                            {v.section && ` · ${v.section}`}
                            {v.duration_seconds && ` · ${Math.round(v.duration_seconds / 60)} min`}
                          </p>
                          {v.url && (
                            <a
                              href={v.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground underline hover:text-foreground"
                            >
                              Preview source
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" render={<Link href={`/admin/videos/${v.id}/edit`} />}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => del.request(v)}>
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {res && res.videos.meta.total > 0 && <Paginator meta={res.videos.meta} onPageChange={setPage} />}
            </CardContent>
          </Card>

          <ConfirmDeleteDialog
            open={del.open}
            onOpenChange={del.setOpen}
            title="Delete video?"
            description={del.error ?? (del.target ? `Are you sure you want to delete "${del.target.title}"? This cannot be undone.` : "")}
            onConfirm={del.confirm}
          />
        </div>
      </AppLayout>
    </AdminGuard>
  );
}

export default function VideosIndexPage() {
  return (
    <Suspense>
      <VideosIndexInner />
    </Suspense>
  );
}
