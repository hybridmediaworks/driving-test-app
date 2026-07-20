"use client";

import Link from "next/link";
import type { QuizCategory } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import Paginator from "@/components/ui/Paginator";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useDeleteConfirm, usePaginatedList } from "@/hooks/use-paginated-list";

type Row = QuizCategory;

export default function QuizCategoriesIndexPage() {
  const { data: categories, reload } = usePaginatedList<Row>("/admin/quiz-categories");
  const del = useDeleteConfirm<Row>(
    (row) => api.delete(`/admin/quiz-categories/${row.id}`),
    reload,
    "Failed to delete category.",
  );

  const rows = categories?.data ?? [];

  return (
    <AdminGuard>
      <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Quiz categories", href: "/admin/quiz-categories" }]}>
        <div className="app-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-0.5">
              <h1 className="text-lg font-semibold">Quiz categories</h1>
              <p className="text-sm text-muted-foreground">Basics, intermediate, exam buckets, etc.</p>
            </div>
            <Button className="w-full shrink-0 sm:w-auto" render={<Link href="/admin/quiz-categories/create" />}>
              New category
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Categories <span className="font-normal text-muted-foreground">({categories?.meta.total ?? 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No categories yet.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {rows.map((c) => (
                    <li key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <Link href={`/admin/quiz-categories/${c.id}/edit`} className="font-medium hover:underline">
                          {c.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          <code className="text-xs">{c.name}</code> · Order {c.order_no} · {c.quizzes_count ?? 0} quiz(zes)
                        </p>
                        {c.is_active ? (
                          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Active</span>
                        ) : (
                          <span className="inline-flex rounded-full bg-neutral-500/15 px-2 py-0.5 text-xs">Inactive</span>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" render={<Link href={`/admin/quiz-categories/${c.id}/edit`} />}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => del.request(c)}>
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {categories && categories.meta.total > 0 && <Paginator meta={categories.meta} />}
            </CardContent>
          </Card>

          <ConfirmDeleteDialog
            open={del.open}
            onOpenChange={del.setOpen}
            title="Delete category?"
            description={
              del.error ??
              (del.target
                ? `Are you sure you want to delete "${del.target.title}"? This cannot be undone. Categories that still have quizzes cannot be deleted.`
                : "")
            }
            onConfirm={del.confirm}
          />
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
