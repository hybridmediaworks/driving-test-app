"use client";

import { use } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import HazardForm from "@/components/admin/HazardForm";

export default function CreateHazardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AdminGuard>
      <AppLayout
        breadcrumbs={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Hazard Simulators", href: "/admin/hazard-simulators" },
          { title: "Hazards", href: `/admin/hazard-simulators/${id}/hazards` },
          { title: "New", href: `/admin/hazard-simulators/${id}/hazards/create` },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">New hazard</h1>
            <p className="text-sm text-muted-foreground">
              Staff-added hazards are never touched by the content importer.
            </p>
          </div>

          <HazardForm mode="create" simulatorId={id} />
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
