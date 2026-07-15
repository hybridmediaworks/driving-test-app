"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import type { PaginatedResponse, Quiz, QuizQuestion } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import Paginator from "@/components/admin/Paginator";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";

type QuestionsResponse = {
  quiz: Quiz;
  questions: PaginatedResponse<QuizQuestion>;
};

function questionPreview(text: string, max = 180): string {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function quizContextLine(quiz: Quiz): string {
  const parts = [quiz.category?.title, quiz.quizType?.title].filter(Boolean) as string[];
  if (quiz.state) parts.push(`${quiz.state.name} (${quiz.state.code})`);
  if (quiz.vehicleType) parts.push(quiz.vehicleType.title);
  parts.push(quiz.test_track === "permit_test" ? "Permit test" : "Driving test");
  return parts.join(" · ");
}

export default function QuizQuestionsIndexPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [res, setRes] = useState<QuestionsResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuizQuestion | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function load() {
    api.get<QuestionsResponse>(`/admin/quizzes/${id}/questions`).then(setRes);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function globalPosition(pageIndex: number): number {
    if (!res) return pageIndex + 1;
    return (res.questions.current_page - 1) * res.questions.per_page + pageIndex + 1;
  }

  function canMoveUp(pageIndex: number): boolean {
    return globalPosition(pageIndex) > 1;
  }

  function canMoveDown(pageIndex: number): boolean {
    return res ? globalPosition(pageIndex) < res.questions.total : false;
  }

  async function moveQuestion(q: QuizQuestion, direction: "up" | "down") {
    await api.post(`/admin/quizzes/${id}/questions/${q.id}/move`, { direction });
    load();
  }

  function requestDelete(q: QuizQuestion) {
    setDeleteTarget(q);
    setDeleteError(null);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/quizzes/${id}/questions/${deleteTarget.id}`);
      load();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Failed to delete question.");
    }
  }

  function hasAnswerFeedback(q: QuizQuestion): boolean {
    return (q.answers ?? []).some((a) => typeof a.explanation === "string" && a.explanation.trim() !== "");
  }

  const rows = res?.questions.data ?? [];

  return (
    <AdminGuard>
      <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Quizzes", href: "/admin/quizzes" }]}>
        <div className="app-page">
          {res && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-lg font-semibold">Quiz questions</h1>
                <p className="text-sm text-muted-foreground">{quizContextLine(res.quiz)}</p>
                <p className="mt-1 text-sm font-medium text-muted-foreground">{res.quiz.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Questions are shown to learners in this order. Use the arrows to swap a question with the one above or below it in the
                  full list (works across pages).
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                <Button className="w-full sm:w-auto" variant="outline" render={<Link href={`/admin/quizzes/${id}/edit`} />}>
                  Quiz settings
                </Button>
                <Button className="w-full sm:w-auto" render={<Link href={`/admin/quizzes/${id}/questions/create`} />}>
                  Add question
                </Button>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Assigned questions{" "}
                <span className="font-normal text-muted-foreground">
                  ({res?.questions.total ?? 0} · stored total {res?.quiz.total_questions ?? 0})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No questions yet. Add questions to build this quiz—each one belongs only to this quiz, in the order you set here.
                </div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {rows.map((q, index) => (
                    <li key={q.id} className="space-y-2 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                        <div className="flex min-w-0 gap-3">
                          <div className="flex shrink-0 flex-col gap-1 pt-0.5 text-muted-foreground">
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-8"
                              type="button"
                              disabled={!canMoveUp(index)}
                              title="Move up in full list"
                              onClick={() => moveQuestion(q, "up")}
                            >
                              <ArrowUp className="size-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-8"
                              type="button"
                              disabled={!canMoveDown(index)}
                              title="Move down in full list"
                              onClick={() => moveQuestion(q, "down")}
                            >
                              <ArrowDown className="size-4" />
                            </Button>
                          </div>
                          <div className="min-w-0">
                            <p className="mb-1 text-xs font-medium text-muted-foreground">#{globalPosition(index)}</p>
                            <p className="whitespace-pre-wrap text-sm font-medium">{q.question_text}</p>
                            <p className="text-xs text-muted-foreground">
                              {q.difficulty}
                              {q.topic && ` · ${q.topic}`}
                              {` · ${(q.answers ?? []).length} answers`}
                              {hasAnswerFeedback(q) && " · per-answer feedback"}
                              {q.images && q.images.length > 0 && ` · ${q.images.length} image${q.images.length === 1 ? "" : "s"}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">
                          <Button variant="outline" size="sm" render={<Link href={`/admin/quizzes/${id}/questions/${q.id}/edit`} />}>
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => requestDelete(q)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {res && res.questions.total > 0 && (
                <Paginator
                  links={res.questions.links}
                  from={res.questions.from}
                  to={res.questions.to}
                  total={res.questions.total}
                  lastPage={res.questions.last_page}
                />
              )}
            </CardContent>
          </Card>

          <ConfirmDeleteDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title="Delete question?"
            description={
              deleteError ??
              (deleteTarget ? `Are you sure you want to delete this question?\n\n"${questionPreview(deleteTarget.question_text)}"\n\nThis cannot be undone.` : "")
            }
            onConfirm={confirmDelete}
          />
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
