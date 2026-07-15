"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PaginatedResponse, QuizCategory } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import Paginator from "@/components/admin/Paginator";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";

type Row = QuizCategory;

export default function QuizCategoriesIndexPage() {
  const [categories, setCategories] = useState<PaginatedResponse<Row> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function load() {
    api.get<PaginatedResponse<Row>>("/admin/quiz-categories").then(setCategories);
  }

  useEffect(() => {
    load();
  }, []);

  function requestDelete(c: Row) {
    setDeleteTarget(c);
    setDeleteError(null);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/quiz-categories/${deleteTarget.id}`);
      load();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Failed to delete category.");
    }
  }

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
                Categories <span className="font-normal text-muted-foreground">({categories?.total ?? 0})</span>
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
                        <Button variant="destructive" size="sm" onClick={() => requestDelete(c)}>
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {categories && categories.total > 0 && (
                <Paginator links={categories.links} from={categories.from} to={categories.to} total={categories.total} lastPage={categories.last_page} />
              )}
            </CardContent>
          </Card>

          <ConfirmDeleteDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title="Delete category?"
            description={
              deleteError ??
              (deleteTarget
                ? `Are you sure you want to delete "${deleteTarget.title}"? This cannot be undone. Categories that still have quizzes cannot be deleted.`
                : "")
            }
            onConfirm={confirmDelete}
          />
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
