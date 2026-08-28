"use client";

import Link from "next/link";
import { Suspense } from "react";
import type { AdminExpert } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import Paginator from "@/components/ui/Paginator";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useDeleteConfirm, usePaginatedList, useUrlQuery } from "@/hooks/use-paginated-list";

function ExpertsIndexInner() {
  const { page, setPage } = useUrlQuery();
  const { data: experts, reload } = usePaginatedList<AdminExpert>("/admin/experts", page);
  const del = useDeleteConfirm<AdminExpert>(
    (row) => api.delete(`/admin/experts/${row.id}`),
    reload,
    "Failed to delete expert.",
  );

  const rows = experts?.data ?? [];

  return (
    <AdminGuard>
      <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Experts", href: "/admin/experts" }]}>
        <div className="app-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-0.5">
              <h1 className="text-lg font-semibold">Experts</h1>
              <p className="text-sm text-muted-foreground">
                The &quot;verified by&quot; reviewer roster. Each has a public profile at{" "}
                <code className="text-xs">/experts/&lt;slug&gt;</code>; the first published one shows in the state and quiz
                trust badges.
              </p>
            </div>
            <Button className="w-full shrink-0 sm:w-auto" render={<Link href="/admin/experts/create" />}>
              New expert
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Experts <span className="font-normal text-muted-foreground">({experts?.meta.total ?? 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No experts yet.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {rows.map((expert) => (
                    <li key={expert.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                          {expert.photo_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={expert.photo_url} alt="" className="h-10 w-10 object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <Link href={`/admin/experts/${expert.id}/edit`} className="font-medium hover:underline">
                            {expert.name}
                          </Link>
                          <p className="truncate text-sm text-muted-foreground">
                            {expert.title} · <code className="text-xs">/experts/{expert.slug}</code>
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {expert.is_published ? (
                              <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                Published
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-neutral-500/15 px-2 py-0.5 text-xs">Hidden</span>
                            )}
                            <span className="inline-flex rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-700">
                              #{expert.sort_order}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" render={<Link href={`/experts/${expert.slug}`} />}>
                          View
                        </Button>
                        <Button variant="outline" size="sm" render={<Link href={`/admin/experts/${expert.id}/edit`} />}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => del.request(expert)}>
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {experts && experts.meta.total > 0 && <Paginator meta={experts.meta} onPageChange={setPage} />}
            </CardContent>
          </Card>

          <ConfirmDeleteDialog
            open={del.open}
            onOpenChange={del.setOpen}
            title="Delete expert?"
            description={
              del.error ??
              (del.target
                ? `Delete "${del.target.name}"? Their /experts/${del.target.slug} page will 404. This cannot be undone.`
                : "")
            }
            onConfirm={del.confirm}
          />
        </div>
      </AppLayout>
    </AdminGuard>
  );
}

export default function ExpertsIndexPage() {
  return (
    <Suspense>
      <ExpertsIndexInner />
    </Suspense>
  );
}
