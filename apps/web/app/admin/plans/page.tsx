"use client";

import Link from "next/link";
import { Suspense } from "react";
import type { AdminPlan } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import Paginator from "@/components/ui/Paginator";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useDeleteConfirm, usePaginatedList, useUrlQuery } from "@/hooks/use-paginated-list";

function formatPrice(priceCents: number): string {
  return (priceCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function PlansIndexInner() {
  const { page, setPage } = useUrlQuery();
  const { data: plans, reload } = usePaginatedList<AdminPlan>("/admin/plans", page);
  const del = useDeleteConfirm<AdminPlan>(
    (row) => api.delete(`/admin/plans/${row.id}`),
    reload,
    "Failed to delete plan.",
  );

  const rows = plans?.data ?? [];

  return (
    <AdminGuard>
      <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Plans", href: "/admin/plans" }]}>
        <div className="app-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-0.5">
              <h1 className="text-lg font-semibold">Plans</h1>
              <p className="text-sm text-muted-foreground">
                Free / Weekly / Monthly / Lifetime Family. A new plan still needs{" "}
                <code className="text-xs">php artisan billing:sync-plans</code> run before it has a real Stripe price.
              </p>
            </div>
            <Button className="w-full shrink-0 sm:w-auto" render={<Link href="/admin/plans/create" />}>
              New plan
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Plans <span className="font-normal text-muted-foreground">({plans?.meta.total ?? 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No plans yet.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {rows.map((p) => (
                    <li key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <Link href={`/admin/plans/${p.id}/edit`} className="font-medium hover:underline">
                          {p.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          <code className="text-xs">{p.key}</code> · {formatPrice(p.price_cents)}
                          {p.type === "one_time" ? " one-time" : p.billing_interval === "week" ? " / week" : " / month"} · {p.max_seats}{" "}
                          seat(s)
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {p.is_active ? (
                            <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Active</span>
                          ) : (
                            <span className="inline-flex rounded-full bg-neutral-500/15 px-2 py-0.5 text-xs">Inactive</span>
                          )}
                          {p.stripe_price_id ? (
                            <span className="inline-flex rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-700">
                              Synced to Stripe
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700">
                              Not synced — run billing:sync-plans
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" render={<Link href={`/admin/plans/${p.id}/edit`} />}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => del.request(p)}>
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {plans && plans.meta.total > 0 && <Paginator meta={plans.meta} onPageChange={setPage} />}
            </CardContent>
          </Card>

          <ConfirmDeleteDialog
            open={del.open}
            onOpenChange={del.setOpen}
            title="Delete plan?"
            description={
              del.error ??
              (del.target
                ? `Are you sure you want to delete "${del.target.name}"? This cannot be undone. Plans already synced to Stripe or with family groups can't be deleted — deactivate instead.`
                : "")
            }
            onConfirm={del.confirm}
          />
        </div>
      </AppLayout>
    </AdminGuard>
  );
}

export default function PlansIndexPage() {
  return (
    <Suspense>
      <PlansIndexInner />
    </Suspense>
  );
}
