"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import type { AdminHazardSimulatorShowResponse } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import HazardSimulatorForm from "@/components/admin/HazardSimulatorForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export default function EditHazardSimulatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<AdminHazardSimulatorShowResponse | null>(null);

  useEffect(() => {
    api.get<AdminHazardSimulatorShowResponse>(`/admin/hazard-simulators/${id}`).then(setData);
  }, [id]);

  return (
    <AdminGuard>
      <AppLayout
        breadcrumbs={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Hazard Simulators", href: "/admin/hazard-simulators" },
          { title: "Edit", href: "/admin/hazard-simulators" },
        ]}
      >
        <div className="app-page">
          {!data ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <>
              <div className="space-y-0.5">
                <h1 className="text-lg font-semibold">Edit hazard simulator</h1>
                <p className="text-sm text-muted-foreground">{data.hazard_simulator.video?.title ?? data.hazard_simulator.slug}</p>
              </div>

              <HazardSimulatorForm data={data} />

              <div className="grid max-w-2xl gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Least-spotted hazards</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.hazard_stats.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No attempt data yet.</p>
                    ) : (
                      <ul className="divide-y divide-border rounded-md border">
                        {data.hazard_stats.map((h) => (
                          <li key={h.hazard_id} className="flex items-center justify-between gap-3 p-3 text-sm">
                            <span className="min-w-0 truncate">
                              <span className="font-medium capitalize">{h.type}</span>
                              {h.comment ? ` · ${h.comment}` : ""}
                            </span>
                            <span className="shrink-0 text-muted-foreground">
                              {h.miss_rate}% missed ({h.misses}/{h.total})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent attempts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.recent_attempts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No attempts yet.</p>
                    ) : (
                      <ul className="divide-y divide-border rounded-md border">
                        {data.recent_attempts.map((a) => (
                          <li key={a.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                            <span>
                              <span className="font-medium">{a.score}%</span> · {a.hazards_spotted}/{a.hazards_total} spotted
                              {a.reaction_band ? ` · ${a.reaction_band}` : ""}
                            </span>
                            <span className="shrink-0 text-muted-foreground">{formatDate(a.completed_at)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link
                      href={`/admin/hazard-simulator-attempts?hazard_simulator_id=${data.hazard_simulator.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View all attempts
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
