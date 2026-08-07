"use client";

import Link from "next/link";
import { Suspense } from "react";
import type { VehicleType } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import Paginator from "@/components/ui/Paginator";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useDeleteConfirm, usePaginatedList, useUrlQuery } from "@/hooks/use-paginated-list";

function VehicleTypesIndexInner() {
  const { page, setPage } = useUrlQuery();
  const { data: vehicleTypes, reload } = usePaginatedList<VehicleType>("/admin/vehicle-types", page);
  const del = useDeleteConfirm<VehicleType>(
    (row) => api.delete(`/admin/vehicle-types/${row.id}`),
    reload,
    "Failed to delete vehicle type.",
  );

  const rows = vehicleTypes?.data ?? [];

  return (
    <AdminGuard>
      <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Vehicle types", href: "/admin/vehicle-types" }]}>
        <div className="app-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-0.5">
              <h1 className="text-lg font-semibold">Vehicle types</h1>
              <p className="text-sm text-muted-foreground">Car, motorcycle, CDL, etc.</p>
            </div>
            <Button className="w-full shrink-0 sm:w-auto" render={<Link href="/admin/vehicle-types/create" />}>
              New vehicle type
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Vehicle types <span className="font-normal text-muted-foreground">({vehicleTypes?.meta.total ?? 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No vehicle types yet.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {rows.map((v) => (
                    <li key={v.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <Link href={`/admin/vehicle-types/${v.id}/edit`} className="font-medium hover:underline">
                          {v.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          <code className="text-xs">{v.name}</code>
                        </p>
                        {v.is_active ? (
                          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Active</span>
                        ) : (
                          <span className="inline-flex rounded-full bg-neutral-500/15 px-2 py-0.5 text-xs">Inactive</span>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" render={<Link href={`/admin/vehicle-types/${v.id}/edit`} />}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => del.request(v)}>
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {vehicleTypes && vehicleTypes.meta.total > 0 && <Paginator meta={vehicleTypes.meta} onPageChange={setPage} />}
            </CardContent>
          </Card>

          <ConfirmDeleteDialog
            open={del.open}
            onOpenChange={del.setOpen}
            title="Delete vehicle type?"
            description={
              del.error ??
              (del.target
                ? `Are you sure you want to delete "${del.target.title}"? This cannot be undone. Vehicle types that still have quizzes cannot be deleted.`
                : "")
            }
            onConfirm={del.confirm}
          />
        </div>
      </AppLayout>
    </AdminGuard>
  );
}

export default function VehicleTypesIndexPage() {
  return (
    <Suspense>
      <VehicleTypesIndexInner />
    </Suspense>
  );
}
