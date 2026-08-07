"use client";

import Link from "next/link";
import { Suspense } from "react";
import type { QuizType } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import Paginator from "@/components/ui/Paginator";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useDeleteConfirm, usePaginatedList, useUrlQuery } from "@/hooks/use-paginated-list";

function QuizTypesIndexInner() {
  const { page, setPage } = useUrlQuery();
  const { data: quizTypes, reload } = usePaginatedList<QuizType>("/admin/quiz-types", page);
  const del = useDeleteConfirm<QuizType>(
    (row) => api.delete(`/admin/quiz-types/${row.id}`),
    reload,
    "Failed to delete quiz type.",
  );

  const rows = quizTypes?.data ?? [];

  return (
    <AdminGuard>
      <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Quiz types", href: "/admin/quiz-types" }]}>
        <div className="app-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-0.5">
              <h1 className="text-lg font-semibold">Quiz types</h1>
              <p className="text-sm text-muted-foreground">Practice vs. Final Exam Simulation, etc.</p>
            </div>
            <Button className="w-full shrink-0 sm:w-auto" render={<Link href="/admin/quiz-types/create" />}>
              New quiz type
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Quiz types <span className="font-normal text-muted-foreground">({quizTypes?.meta.total ?? 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No quiz types yet.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {rows.map((q) => (
                    <li key={q.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <Link href={`/admin/quiz-types/${q.id}/edit`} className="font-medium hover:underline">
                          {q.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          <code className="text-xs">{q.name}</code>
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" render={<Link href={`/admin/quiz-types/${q.id}/edit`} />}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => del.request(q)}>
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {quizTypes && quizTypes.meta.total > 0 && <Paginator meta={quizTypes.meta} onPageChange={setPage} />}
            </CardContent>
          </Card>

          <ConfirmDeleteDialog
            open={del.open}
            onOpenChange={del.setOpen}
            title="Delete quiz type?"
            description={
              del.error ??
              (del.target
                ? `Are you sure you want to delete "${del.target.title}"? This cannot be undone. Quiz types that still have quizzes cannot be deleted.`
                : "")
            }
            onConfirm={del.confirm}
          />
        </div>
      </AppLayout>
    </AdminGuard>
  );
}

export default function QuizTypesIndexPage() {
  return (
    <Suspense>
      <QuizTypesIndexInner />
    </Suspense>
  );
}
