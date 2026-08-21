"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import type { AdminAmbientTrack, PaginatedResponse, QuizCategory } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Paginator from "@/components/ui/Paginator";
import { api } from "@/lib/api";
import { useDeleteConfirm, useUrlQuery } from "@/hooks/use-paginated-list";

type TracksResponse = {
  tracks: PaginatedResponse<AdminAmbientTrack>;
  categories: Pick<QuizCategory, "id" | "name" | "title">[];
};

function AmbientTracksIndexInner() {
  const { searchParams, updateFilter, setPage } = useUrlQuery();
  const [res, setRes] = useState<TracksResponse | null>(null);

  const query = searchParams.toString();

  function load() {
    api.get<TracksResponse>(`/admin/ambient-tracks${query ? `?${query}` : ""}`).then(setRes);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const del = useDeleteConfirm<AdminAmbientTrack>(
    (t) => api.delete(`/admin/ambient-tracks/${t.id}`),
    load,
    "Failed to delete ambient track.",
  );

  const rows = res?.tracks.data ?? [];

  return (
    <AdminGuard>
      <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Ambient Tracks", href: "/admin/ambient-tracks" }]}>
        <div className="app-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-0.5">
              <h1 className="text-lg font-semibold">Ambient Tracks</h1>
              <p className="text-sm text-muted-foreground">Background-music loops offered in the quiz Settings panel</p>
            </div>
            <Button className="w-full shrink-0 sm:w-auto" render={<Link href="/admin/ambient-tracks/create" />}>
              New track
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
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
            <label className="flex cursor-pointer items-center gap-2 self-center text-sm">
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
                All tracks <span className="font-normal text-muted-foreground">({res?.tracks.meta.total ?? 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No ambient tracks yet.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {rows.map((t) => (
                    <li key={t.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{t.title}</span>
                          {!t.is_active && <span className="text-xs text-neutral-500">Inactive</span>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Order {t.order_no} · {t.category?.title ?? "Every category (global)"}
                        </p>
                        {t.url && (
                          <a
                            href={t.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground underline hover:text-foreground"
                          >
                            Preview source
                          </a>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" render={<Link href={`/admin/ambient-tracks/${t.id}/edit`} />}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => del.request(t)}>
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {res && res.tracks.meta.total > 0 && <Paginator meta={res.tracks.meta} onPageChange={setPage} />}
            </CardContent>
          </Card>

          <ConfirmDeleteDialog
            open={del.open}
            onOpenChange={del.setOpen}
            title="Delete ambient track?"
            description={del.error ?? (del.target ? `Are you sure you want to delete "${del.target.title}"? This cannot be undone.` : "")}
            onConfirm={del.confirm}
          />
        </div>
      </AppLayout>
    </AdminGuard>
  );
}

export default function AmbientTracksIndexPage() {
  return (
    <Suspense>
      <AmbientTracksIndexInner />
    </Suspense>
  );
}
