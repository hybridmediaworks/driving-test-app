"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import type { AdminHazardSimulatorsResponse } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import Paginator from "@/components/ui/Paginator";
import { Button } from "@/components/ui/ShadcnButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useUrlQuery } from "@/hooks/use-paginated-list";

const SELECT_CLASS = "h-9 rounded-md border border-input bg-background px-3 text-sm";

function HazardSimulatorsIndexInner() {
  const { searchParams, updateFilter, setPage } = useUrlQuery();
  const [res, setRes] = useState<AdminHazardSimulatorsResponse | null>(null);
  const query = searchParams.toString();

  const load = useCallback(() => {
    api.get<AdminHazardSimulatorsResponse>(`/admin/hazard-simulators${query ? `?${query}` : ""}`).then(setRes);
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = res?.hazard_simulators.data ?? [];
  const meta = res?.hazard_simulators.meta;

  return (
    <AdminGuard>
      <AppLayout
        breadcrumbs={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Hazard Simulators", href: "/admin/hazard-simulators" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">Hazard simulators</h1>
            <p className="text-sm text-muted-foreground">
              The interactive layer on the &quot;Defensive Driving Hazard Simulators&quot; videos. Simulators are created by
              the content importer — here you tune scoring, edit hazards, and lock a simulator so a re-crawl leaves your
              edits alone.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              className={SELECT_CLASS}
              value={searchParams.get("state_id") ?? ""}
              onChange={(e) => updateFilter("state_id", e.target.value)}
            >
              <option value="">All states</option>
              {res?.states.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
            <select
              className={SELECT_CLASS}
              value={searchParams.get("vehicle_type_id") ?? ""}
              onChange={(e) => updateFilter("vehicle_type_id", e.target.value)}
            >
              <option value="">All vehicle types</option>
              {res?.vehicle_types.map((v) => (
                <option key={v.id} value={String(v.id)}>
                  {v.title}
                </option>
              ))}
            </select>
            <select
              className={SELECT_CLASS}
              value={searchParams.get("test_level") ?? ""}
              onChange={(e) => updateFilter("test_level", e.target.value)}
            >
              <option value="">Any difficulty</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={searchParams.get("locked_only") === "1"}
                onChange={(e) => updateFilter("locked_only", e.target.checked ? "1" : "")}
              />
              Locked only
            </label>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                All simulators <span className="font-normal text-muted-foreground">({meta?.total ?? 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No simulators match these filters.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {rows.map((sim) => (
                    <li key={sim.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <Link href={`/admin/hazard-simulators/${sim.id}/edit`} className="font-medium hover:underline">
                          {sim.video?.title ?? sim.slug}
                        </Link>
                        <p className="truncate text-sm text-muted-foreground">
                          {sim.hazard_count} hazards · {sim.test_level ?? "—"} · {sim.test_location ?? "—"} ·{" "}
                          {sim.attempts_count ?? 0} attempts
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {sim.video?.is_premium && (
                            <span className="inline-flex rounded-full bg-orange-500/15 px-2 py-0.5 text-xs text-orange-700">
                              Premium
                            </span>
                          )}
                          {!sim.is_active && (
                            <span className="inline-flex rounded-full bg-neutral-500/15 px-2 py-0.5 text-xs">Inactive</span>
                          )}
                          {sim.content_locked && (
                            <span className="inline-flex rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-700">
                              Locked
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          render={<Link href={`/admin/hazard-simulators/${sim.id}/hazards`} />}
                        >
                          Hazards
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          render={<Link href={`/admin/hazard-simulators/${sim.id}/edit`} />}
                        >
                          Edit
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {meta && meta.total > 0 && <Paginator meta={meta} onPageChange={setPage} />}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}

export default function HazardSimulatorsIndexPage() {
  return (
    <Suspense>
      <HazardSimulatorsIndexInner />
    </Suspense>
  );
}
