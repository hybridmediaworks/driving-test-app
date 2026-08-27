"use client";

import { Suspense } from "react";
import type { EmailSubscriber } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Paginator from "@/components/ui/Paginator";
import { api } from "@/lib/api";
import { useDeleteConfirm, usePaginatedList, useUrlQuery } from "@/hooks/use-paginated-list";

function AdminEmailSubscribersInner() {
  const { searchParams, filterQuery, page, updateFilter, setPage } = useUrlQuery();

  const { data: subscribers, reload } = usePaginatedList<EmailSubscriber>(
    `/admin/email-subscribers${filterQuery ? `?${filterQuery}` : ""}`,
    page,
  );
  const rows = subscribers?.data ?? [];

  const del = useDeleteConfirm<EmailSubscriber>(
    (row) => api.delete(`/admin/email-subscribers/${row.id}`),
    reload,
    "Failed to delete subscriber.",
  );

  return (
    <AdminGuard>
      <AppLayout
        breadcrumbs={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Email subscribers", href: "/admin/email-subscribers" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">Email subscribers</h1>
            <p className="text-sm text-muted-foreground">Daily-question signups captured from the site</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
            <div className="flex w-full flex-col gap-1 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="f-search">Search email</label>
              <input
                id="f-search"
                type="search"
                placeholder="you@email.com"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                defaultValue={searchParams.get("search") ?? ""}
                onChange={(e) => updateFilter("search", e.target.value)}
              />
            </div>
            <div className="flex w-full flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="f-status">Status</label>
              <select
                id="f-status"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={searchParams.get("status") ?? ""}
                onChange={(e) => updateFilter("status", e.target.value)}
              >
                <option value="">All</option>
                <option value="subscribed">Subscribed</option>
                <option value="unsubscribed">Unsubscribed</option>
              </select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Subscribers <span className="font-normal text-muted-foreground">({subscribers?.meta.total ?? 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No subscribers found.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {rows.map((s) => (
                    <li key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium break-all">{s.email}</span>
                          {s.is_subscribed ? (
                            <span className="inline-flex rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-700 dark:text-green-400">
                              Subscribed
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-neutral-500/15 px-2 py-0.5 text-xs">Unsubscribed</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {s.state ?? "No state"} · signed up {new Date(s.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="destructive" size="sm" onClick={() => del.request(s)}>
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {subscribers && subscribers.meta.total > 0 && <Paginator meta={subscribers.meta} onPageChange={setPage} />}
            </CardContent>
          </Card>

          <ConfirmDeleteDialog
            open={del.open}
            onOpenChange={del.setOpen}
            title="Delete subscriber?"
            description={
              del.error ??
              (del.target ? `Remove "${del.target.email}" from the subscriber list? This cannot be undone.` : "")
            }
            onConfirm={del.confirm}
          />
        </div>
      </AppLayout>
    </AdminGuard>
  );
}

export default function AdminEmailSubscribersPage() {
  return (
    <Suspense>
      <AdminEmailSubscribersInner />
    </Suspense>
  );
}
