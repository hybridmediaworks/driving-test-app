"use client";

import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import ExpertForm from "@/components/admin/ExpertForm";

export default function CreateExpertPage() {
  return (
    <AdminGuard>
      <AppLayout
        breadcrumbs={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Experts", href: "/admin/experts" },
          { title: "New", href: "/admin/experts/create" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">New expert</h1>
            <p className="text-sm text-muted-foreground">Publishes a public profile at /experts/&lt;slug&gt;.</p>
          </div>

          <ExpertForm mode="create" />
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
