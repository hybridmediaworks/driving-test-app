"use client";

import { use, useEffect, useState } from "react";
import type { AdminExpert } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import ExpertForm from "@/components/admin/ExpertForm";
import { api } from "@/lib/api";

export default function EditExpertPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [expert, setExpert] = useState<AdminExpert | null>(null);

  useEffect(() => {
    api.get<{ expert: AdminExpert }>(`/admin/experts/${id}`).then((res) => setExpert(res.expert));
  }, [id]);

  return (
    <AdminGuard>
      <AppLayout
        breadcrumbs={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Experts", href: "/admin/experts" },
          { title: "Edit", href: "/admin/experts" },
        ]}
      >
        <div className="app-page">
          {!expert ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <>
              <div className="space-y-0.5">
                <h1 className="text-lg font-semibold">Edit expert</h1>
                <p className="text-sm text-muted-foreground">{expert.name}</p>
              </div>

              <ExpertForm mode="edit" expert={expert} />
            </>
          )}
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
