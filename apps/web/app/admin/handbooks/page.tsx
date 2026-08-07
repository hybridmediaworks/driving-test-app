"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import type { Handbook, PaginatedResponse, State, VehicleType } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Paginator from "@/components/ui/Paginator";
import { api } from "@/lib/api";
import { useDeleteConfirm, useUrlQuery } from "@/hooks/use-paginated-list";

type HandbooksResponse = {
  handbooks: PaginatedResponse<Handbook>;
  states: State[];
  vehicle_types: Pick<VehicleType, "id" | "name" | "title">[];
};

function HandbooksIndexInner() {
  const { searchParams, updateFilter, setPage } = useUrlQuery();
  const [res, setRes] = useState<HandbooksResponse | null>(null);

  const query = searchParams.toString();

  function load() {
    api.get<HandbooksResponse>(`/admin/handbooks${query ? `?${query}` : ""}`).then(setRes);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const del = useDeleteConfirm<Handbook>((h) => api.delete(`/admin/handbooks/${h.id}`), load, "Failed to delete handbook.");

  const rows = res?.handbooks.data ?? [];

  return (
    <AdminGuard>
      <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Handbooks", href: "/admin/handbooks" }]}>
        <div className="app-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-0.5">
              <h1 className="text-lg font-semibold">Handbooks</h1>
              <p className="text-sm text-muted-foreground">One handbook per state x vehicle type x language</p>
            </div>
            <Button className="w-full shrink-0 sm:w-auto" render={<Link href="/admin/handbooks/create" />}>
              New handbook
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                All handbooks <span className="font-normal text-muted-foreground">({res?.handbooks.meta.total ?? 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No handbooks yet.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {rows.map((h) => (
                    <li key={h.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{h.title}</span>
                          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs uppercase text-muted-foreground">
                            {h.language}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {h.state?.name ?? "—"} · {h.vehicle_type?.title ?? "—"} · {h.chapters_count ?? 0} chapter
                          {h.chapters_count === 1 ? "" : "s"}
                          {h.total_words != null && ` · ${h.total_words.toLocaleString()} words`}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {h.pdf_url && (
                            <a href={h.pdf_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                              PDF
                            </a>
                          )}
                          {h.source_url && (
                            <a href={h.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                              Source
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" render={<Link href={`/admin/handbooks/${h.id}/edit`} />}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => del.request(h)}>
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {res && res.handbooks.meta.total > 0 && <Paginator meta={res.handbooks.meta} onPageChange={setPage} />}
            </CardContent>
          </Card>

          <ConfirmDeleteDialog
            open={del.open}
            onOpenChange={del.setOpen}
            title="Delete handbook?"
            description={
              del.error ??
              (del.target ? `Are you sure you want to delete "${del.target.title}"? All its chapters will be removed. This cannot be undone.` : "")
            }
            onConfirm={del.confirm}
          />
        </div>
      </AppLayout>
    </AdminGuard>
  );
}

export default function HandbooksIndexPage() {
  return (
    <Suspense>
      <HandbooksIndexInner />
    </Suspense>
  );
}
