"use client";

import { Suspense, useEffect, useState } from "react";
import type { HazardSimulatorAttempt, PaginatedResponse } from "@driving-test-app/shared";
import type { AdminHazardSimulator } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import Paginator from "@/components/ui/Paginator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { usePaginatedList, useUrlQuery } from "@/hooks/use-paginated-list";

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "—";
}

function AdminHazardAttemptsInner() {
  const { searchParams, filterQuery, page, updateFilter, setPage } = useUrlQuery();
  const { data: attempts } = usePaginatedList<HazardSimulatorAttempt>(
    `/admin/hazard-simulator-attempts${filterQuery ? `?${filterQuery}` : ""}`,
    page,
  );
  const rows = attempts?.data ?? [];

  const [simulators, setSimulators] = useState<AdminHazardSimulator[] | null>(null);
  useEffect(() => {
    api
      .get<{ hazard_simulators: PaginatedResponse<AdminHazardSimulator> }>("/admin/hazard-simulators?per_page=100")
      .then((res) => setSimulators(res.hazard_simulators.data));
  }, []);

  return (
    <AdminGuard>
      <AppLayout
        breadcrumbs={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Hazard Simulators", href: "/admin/hazard-simulators" },
          { title: "Attempts", href: "/admin/hazard-simulator-attempts" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">Hazard simulator attempts</h1>
            <p className="text-sm text-muted-foreground">Every hazard-perception run, across all users and guests.</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
            <div className="flex w-full flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="f-sim">
                Simulator
              </label>
              <select
                id="f-sim"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={searchParams.get("hazard_simulator_id") ?? ""}
                onChange={(e) => updateFilter("hazard_simulator_id", e.target.value)}
              >
                <option value="">{simulators ? "All simulators" : "Loading…"}</option>
                {simulators?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.video?.title ?? s.slug}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex w-full flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="f-status">
                Status
              </label>
              <select
                id="f-status"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={searchParams.get("status") ?? ""}
                onChange={(e) => updateFilter("status", e.target.value)}
              >
                <option value="">All</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In progress</option>
                <option value="abandoned">Abandoned</option>
              </select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Attempts <span className="font-normal text-muted-foreground">({attempts?.meta.total ?? 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No attempts found.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {rows.map((a) => (
                    <li key={a.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium">
                          {a.simulator?.title ?? `Simulator #${a.hazard_simulator_id}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {a.user ? `${a.user.name} (${a.user.email})` : "Guest"} · {a.status}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-0.5 text-sm">
                        <span className="font-medium">{a.score != null ? `${a.score}%` : "—"}</span>
                        <span className="text-muted-foreground">
                          {a.hazards_spotted}/{a.hazards_total} spotted
                        </span>
                        <span className="text-muted-foreground">{a.false_clicks} false</span>
                        {a.reaction_band && <span className="text-muted-foreground">{a.reaction_band}</span>}
                        <span className="text-muted-foreground">{formatDate(a.completed_at)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {attempts && attempts.meta.total > 0 && <Paginator meta={attempts.meta} onPageChange={setPage} />}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}

export default function AdminHazardAttemptsPage() {
  return (
    <Suspense>
      <AdminHazardAttemptsInner />
    </Suspense>
  );
}
