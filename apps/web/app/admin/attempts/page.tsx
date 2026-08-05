"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { PaginatedResponse, Quiz, QuizAttempt, User } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import AttemptRow from "@/components/quiz/AttemptRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Paginator from "@/components/ui/Paginator";
import { api } from "@/lib/api";
import { usePaginatedList } from "@/hooks/use-paginated-list";

function AdminAttemptsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  const { data: attempts } = usePaginatedList<QuizAttempt>(`/admin/attempts${query ? `?${query}` : ""}`);
  const rows = attempts?.data ?? [];

  const [users, setUsers] = useState<User[] | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);

  useEffect(() => {
    api.get<PaginatedResponse<User>>("/admin/users?per_page=100").then((res) => setUsers(res.data));
    api.get<{ quizzes: PaginatedResponse<Quiz> }>("/admin/quizzes?per_page=100").then((res) => setQuizzes(res.quizzes.data));
  }, []);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/admin/attempts?${params.toString()}`);
  }

  return (
    <AdminGuard>
      <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "All Results", href: "/admin/attempts" }]}>
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">All results</h1>
            <p className="text-sm text-muted-foreground">Quiz attempt history across every user</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
            <div className="flex w-full flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="f-user">User</label>
              <select
                id="f-user"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={searchParams.get("user_id") ?? ""}
                onChange={(e) => updateFilter("user_id", e.target.value)}
              >
                <option value="">{users ? "All users" : "Loading…"}</option>
                {users?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex w-full flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="f-quiz">Quiz</label>
              <select
                id="f-quiz"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={searchParams.get("quiz_id") ?? ""}
                onChange={(e) => updateFilter("quiz_id", e.target.value)}
              >
                <option value="">{quizzes ? "All quizzes" : "Loading…"}</option>
                {quizzes?.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.category ? `${q.category.title} — ` : ""}
                    {q.title}
                  </option>
                ))}
              </select>
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
                <option value="completed">Completed</option>
                <option value="in_progress">In progress</option>
              </select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Attempts <span className="font-normal text-muted-foreground">({attempts?.meta.total ?? 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No attempts found.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {rows.map((attempt) => (
                    <AttemptRow key={attempt.id} attempt={attempt} showUser />
                  ))}
                </ul>
              )}
              {attempts && attempts.meta.total > 0 && <Paginator meta={attempts.meta} />}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}

export default function AdminAttemptsPage() {
  return (
    <Suspense>
      <AdminAttemptsInner />
    </Suspense>
  );
}
