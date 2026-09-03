"use client";

import { use, useEffect, useState } from "react";
import type { AdminHazard } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import HazardForm from "@/components/admin/HazardForm";
import { api } from "@/lib/api";

export default function EditHazardPage({ params }: { params: Promise<{ id: string; hazardId: string }> }) {
  const { id, hazardId } = use(params);
  const [hazard, setHazard] = useState<AdminHazard | null>(null);

  useEffect(() => {
    api
      .get<{ hazard: AdminHazard }>(`/admin/hazard-simulators/${id}/hazards/${hazardId}`)
      .then((res) => setHazard(res.hazard));
  }, [id, hazardId]);

  return (
    <AdminGuard>
      <AppLayout
        breadcrumbs={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Hazard Simulators", href: "/admin/hazard-simulators" },
          { title: "Hazards", href: `/admin/hazard-simulators/${id}/hazards` },
          { title: "Edit", href: `/admin/hazard-simulators/${id}/hazards` },
        ]}
      >
        <div className="app-page">
          {!hazard ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <>
              <div className="space-y-0.5">
                <h1 className="text-lg font-semibold">Edit hazard</h1>
                <p className="text-sm text-muted-foreground">
                  {hazard.type_label} · {hazard.time_start.toFixed(1)}–{hazard.time_end.toFixed(1)}s
                </p>
              </div>

              <HazardForm mode="edit" simulatorId={id} hazard={hazard} />
            </>
          )}
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
