"use client";

import Link from "next/link";
import type { QuizAttempt } from "@driving-test-app/shared";
import AppLayout from "@/components/app/AppLayout";
import AttemptRow from "@/components/quiz/AttemptRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Paginator from "@/components/ui/Paginator";
import { usePaginatedList } from "@/hooks/use-paginated-list";

export default function AttemptHistoryPage() {
  const { data: attempts } = usePaginatedList<QuizAttempt>("/attempts");
  const rows = attempts?.data ?? [];

  return (
    <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "My Results", href: "/dashboard/attempts" }]}>
      <div className="app-page">
        <div className="space-y-0.5">
          <h1 className="text-lg font-semibold">My results</h1>
          <p className="text-sm text-muted-foreground">Your quiz attempt history</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Attempts <span className="font-normal text-muted-foreground">({attempts?.meta.total ?? 0})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rows.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No attempts yet. <Link href="/quizzes" className="underline">Take a practice test</Link> to get started.
              </div>
            ) : (
              <ul className="divide-y divide-border rounded-md border">
                {rows.map((attempt) => (
                  <AttemptRow key={attempt.id} attempt={attempt} />
                ))}
              </ul>
            )}
            {attempts && attempts.meta.total > 0 && <Paginator meta={attempts.meta} />}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
