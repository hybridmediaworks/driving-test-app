"use client";

import Link from "next/link";
import { Suspense } from "react";
import type { State } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import Paginator from "@/components/ui/Paginator";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useDeleteConfirm, usePaginatedList, useUrlQuery } from "@/hooks/use-paginated-list";

function StatesIndexInner() {
  const { page, setPage } = useUrlQuery();
  const { data: states, reload } = usePaginatedList<State>("/admin/states", page);
  const del = useDeleteConfirm<State>(
    (row) => api.delete(`/admin/states/${row.id}`),
    reload,
    "Failed to delete state.",
  );

  const rows = states?.data ?? [];

  return (
    <AdminGuard>
      <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "States", href: "/admin/states" }]}>
        <div className="app-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-0.5">
              <h1 className="text-lg font-semibold">States</h1>
              <p className="text-sm text-muted-foreground">The states quizzes and cheat sheets can be scoped to.</p>
            </div>
            <Button className="w-full shrink-0 sm:w-auto" render={<Link href="/admin/states/create" />}>
              New state
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                States <span className="font-normal text-muted-foreground">({states?.meta.total ?? 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No states yet.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {rows.map((s) => (
                    <li key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <Link href={`/admin/states/${s.id}`} className="font-medium hover:underline">
                          {s.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          <code className="text-xs">{s.code}</code>
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" render={<Link href={`/admin/states/${s.id}`} />}>
                          View
                        </Button>
                        <Button variant="outline" size="sm" render={<Link href={`/admin/states/${s.id}/edit`} />}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => del.request(s)}>
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {states && states.meta.total > 0 && <Paginator meta={states.meta} onPageChange={setPage} />}
            </CardContent>
          </Card>

          <ConfirmDeleteDialog
            open={del.open}
            onOpenChange={del.setOpen}
            title="Delete state?"
            description={
              del.error ??
              (del.target
                ? `Are you sure you want to delete "${del.target.name}"? This cannot be undone. States that still have quizzes cannot be deleted.`
                : "")
            }
            onConfirm={del.confirm}
          />
        </div>
      </AppLayout>
    </AdminGuard>
  );
}

export default function StatesIndexPage() {
  return (
    <Suspense>
      <StatesIndexInner />
    </Suspense>
  );
}
