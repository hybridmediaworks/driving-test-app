"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { User } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import Paginator from "@/components/ui/Paginator";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useDeleteConfirm, usePaginatedList } from "@/hooks/use-paginated-list";

function UserManagementInner() {
  const { user: me } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  const { data: users, reload } = usePaginatedList<User>(`/admin/users${query ? `?${query}` : ""}`);
  const del = useDeleteConfirm<User>((u) => api.delete(`/admin/users/${u.id}`), reload, "Failed to delete user.");

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/admin/user-management?${params.toString()}`);
  }

  const rows = users?.data ?? [];

  return (
    <AdminGuard>
      <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "User Management", href: "/admin/user-management" }]}>
        <div className="app-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-0.5">
              <h1 className="text-lg font-semibold">User management</h1>
              <p className="text-sm text-muted-foreground">Accounts, admin access, and verification status</p>
            </div>
            <Button className="w-full shrink-0 sm:w-auto" render={<Link href="/admin/user-management/create" />}>
              New user
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
            <div className="flex w-full flex-col gap-1 sm:col-span-1">
              <label className="text-sm font-medium" htmlFor="f-search">Search</label>
              <Input
                id="f-search"
                placeholder="Name or email"
                defaultValue={searchParams.get("search") ?? ""}
                onChange={(e) => updateFilter("search", e.target.value)}
              />
            </div>
            <div className="flex w-full flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="f-admin">Role</label>
              <select
                id="f-admin"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={searchParams.get("is_admin") ?? ""}
                onChange={(e) => updateFilter("is_admin", e.target.value)}
              >
                <option value="">All</option>
                <option value="1">Admins</option>
                <option value="0">Regular users</option>
              </select>
            </div>
            <div className="flex w-full flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="f-verified">Verification</label>
              <select
                id="f-verified"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={searchParams.get("verified") ?? ""}
                onChange={(e) => updateFilter("verified", e.target.value)}
              >
                <option value="">All</option>
                <option value="1">Verified</option>
                <option value="0">Unverified</option>
              </select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Users <span className="font-normal text-muted-foreground">({users?.meta.total ?? 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No users found.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {rows.map((u) => (
                    <li key={u.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <Link href={`/admin/user-management/${u.id}/edit`} className="font-medium hover:underline">
                          {u.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        <div className="flex flex-wrap gap-2">
                          {u.is_admin && (
                            <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-800">Admin</span>
                          )}
                          {u.email_verified_at ? (
                            <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Verified</span>
                          ) : (
                            <span className="inline-flex rounded-full bg-neutral-500/15 px-2 py-0.5 text-xs">Unverified</span>
                          )}
                          <span className="text-xs text-muted-foreground">Joined {new Date(u.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" render={<Link href={`/admin/user-management/${u.id}/edit`} />}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" disabled={me?.id === u.id} onClick={() => del.request(u)}>
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {users && users.meta.total > 0 && <Paginator meta={users.meta} />}
            </CardContent>
          </Card>

          <ConfirmDeleteDialog
            open={del.open}
            onOpenChange={del.setOpen}
            title="Delete user?"
            description={
              del.error ??
              (del.target ? `Are you sure you want to delete "${del.target.name}" (${del.target.email})? This cannot be undone.` : "")
            }
            onConfirm={del.confirm}
          />
        </div>
      </AppLayout>
    </AdminGuard>
  );
}

export default function UserManagementPage() {
  return (
    <Suspense>
      <UserManagementInner />
    </Suspense>
  );
}
