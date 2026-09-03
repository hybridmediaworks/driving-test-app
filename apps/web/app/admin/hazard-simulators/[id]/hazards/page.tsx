"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { AdminHazard, AdminHazardsResponse } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useDeleteConfirm } from "@/hooks/use-paginated-list";

function HazardRow({
  hazard,
  simulatorId,
  position,
  canMoveUp,
  canMoveDown,
  onMove,
  onDelete,
}: {
  hazard: AdminHazard;
  simulatorId: string;
  position?: number;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMove?: (direction: "up" | "down") => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {position != null && (
          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {position}
          </span>
        )}
        <div className="min-w-0 space-y-1">
          <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
            <span className="capitalize">{hazard.type_label}</span>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                hazard.mode === "demo" ? "bg-purple-500/15 text-purple-700" : "bg-blue-500/15 text-blue-700"
              }`}
            >
              {hazard.mode === "demo" ? "tutorial" : "scored"}
            </span>
            {hazard.box == null && (
              <span className="inline-flex rounded-full bg-neutral-500/15 px-2 py-0.5 text-xs">fallback marker</span>
            )}
            <span className="text-muted-foreground">
              {hazard.time_start.toFixed(1)}–{hazard.time_end.toFixed(1)}s
            </span>
          </p>
          {hazard.comment && <p className="truncate text-sm text-muted-foreground">{hazard.comment}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {onMove && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={!canMoveUp}
              onClick={() => onMove("up")}
              aria-label="Move up"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={!canMoveDown}
              onClick={() => onMove("down")}
              aria-label="Move down"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/admin/hazard-simulators/${simulatorId}/hazards/${hazard.id}/edit`} />}
        >
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </li>
  );
}

export default function HazardsListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<AdminHazardsResponse | null>(null);

  const load = useCallback(() => {
    api.get<AdminHazardsResponse>(`/admin/hazard-simulators/${id}/hazards`).then(setData);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const del = useDeleteConfirm<AdminHazard>(
    (h) => api.delete(`/admin/hazard-simulators/${id}/hazards/${h.id}`),
    load,
    "Failed to delete hazard.",
  );

  async function move(hazard: AdminHazard, direction: "up" | "down") {
    await api.post(`/admin/hazard-simulators/${id}/hazards/${hazard.id}/move`, { direction });
    load();
  }

  const scored = (data?.hazards ?? []).filter((h) => h.in_timeline);
  const pool = (data?.hazards ?? []).filter((h) => !h.in_timeline);

  return (
    <AdminGuard>
      <AppLayout
        breadcrumbs={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Hazard Simulators", href: "/admin/hazard-simulators" },
          { title: "Hazards", href: "/admin/hazard-simulators" },
        ]}
      >
        <div className="app-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-0.5">
              <h1 className="text-lg font-semibold">Hazards</h1>
              <p className="text-sm text-muted-foreground">
                {data?.hazard_simulator.video?.title ?? data?.hazard_simulator.slug ?? "…"} — scored hazards play in this
                order; use ▲▼ to resequence.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" render={<Link href={`/admin/hazard-simulators/${id}/edit`} />}>
                Back to simulator
              </Button>
              <Button render={<Link href={`/admin/hazard-simulators/${id}/hazards/create`} />}>New hazard</Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Scored timeline <span className="font-normal text-muted-foreground">({scored.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scored.length === 0 ? (
                <div className="text-sm text-muted-foreground">No scored hazards.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {scored.map((hazard, i) => (
                    <HazardRow
                      key={hazard.id}
                      hazard={hazard}
                      simulatorId={id}
                      position={i + 1}
                      canMoveUp={i > 0}
                      canMoveDown={i < scored.length - 1}
                      onMove={(direction) => move(hazard, direction)}
                      onDelete={() => del.request(hazard)}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {pool.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Practice pool — not scored <span className="font-normal text-muted-foreground">({pool.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border rounded-md border">
                  {pool.map((hazard) => (
                    <HazardRow
                      key={hazard.id}
                      hazard={hazard}
                      simulatorId={id}
                      onDelete={() => del.request(hazard)}
                    />
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <ConfirmDeleteDialog
            open={del.open}
            onOpenChange={del.setOpen}
            title="Delete hazard?"
            description={
              del.error ??
              (del.target
                ? `Delete this ${del.target.type_label.toLowerCase()} hazard (${del.target.time_start.toFixed(
                    1,
                  )}–${del.target.time_end.toFixed(1)}s)? This cannot be undone.`
                : "")
            }
            onConfirm={del.confirm}
          />
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
