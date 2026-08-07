"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import type { CheatSheet, Flashcard, Handbook, PaginatedResponse, Quiz, State, Video } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/dashboard/StatCard";
import { api } from "@/lib/api";
import { useDeleteConfirm } from "@/hooks/use-paginated-list";

type QuizzesPreview = { quizzes: PaginatedResponse<Quiz> };
type CheatSheetsPreview = { cheat_sheets: PaginatedResponse<CheatSheet> };
type FlashcardsPreview = { flashcards: PaginatedResponse<Flashcard> };
type HandbooksPreview = { handbooks: PaginatedResponse<Handbook> };
type VideosPreview = { videos: PaginatedResponse<Video> };

function PremiumBadge({ isPremium }: { isPremium: boolean }) {
  return isPremium ? (
    <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-800">Premium</span>
  ) : (
    <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Free</span>
  );
}

function ViewStateInner({ id }: { id: string }) {
  const router = useRouter();

  const [state, setState] = useState<State | null>(null);
  const [quizzes, setQuizzes] = useState<PaginatedResponse<Quiz> | null>(null);
  const [cheatSheets, setCheatSheets] = useState<PaginatedResponse<CheatSheet> | null>(null);
  const [flashcards, setFlashcards] = useState<PaginatedResponse<Flashcard> | null>(null);
  const [handbooks, setHandbooks] = useState<PaginatedResponse<Handbook> | null>(null);
  const [videos, setVideos] = useState<PaginatedResponse<Video> | null>(null);

  useEffect(() => {
    api.get<{ state: State }>(`/admin/states/${id}`).then((res) => setState(res.state));
    api.get<QuizzesPreview>(`/admin/quizzes?state_id=${id}&per_page=5`).then((res) => setQuizzes(res.quizzes));
    api.get<CheatSheetsPreview>(`/admin/cheat-sheets?state_id=${id}&per_page=5`).then((res) => setCheatSheets(res.cheat_sheets));
    api.get<FlashcardsPreview>(`/admin/flashcards?state_id=${id}&per_page=5`).then((res) => setFlashcards(res.flashcards));
    api.get<HandbooksPreview>(`/admin/handbooks?state_id=${id}&per_page=5`).then((res) => setHandbooks(res.handbooks));
    api.get<VideosPreview>(`/admin/videos?state_id=${id}&per_page=5`).then((res) => setVideos(res.videos));
  }, [id]);

  const del = useDeleteConfirm<State>(
    (s) => api.delete(`/admin/states/${s.id}`),
    () => router.push("/admin/states"),
    "Failed to delete state.",
  );

  if (!state) {
    return (
      <AdminGuard>
        <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "States", href: "/admin/states" }]}>
          <div className="app-page text-sm text-muted-foreground">Loading…</div>
        </AppLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AppLayout
        breadcrumbs={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "States", href: "/admin/states" },
          { title: state.name, href: `/admin/states/${state.id}` },
        ]}
      >
        <div className="app-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold">{state.name}</h1>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">{state.code}</code>
              </div>
              <p className="text-sm text-muted-foreground">
                {state.agency_name || "DMV"}
                {state.dmv_website_url && (
                  <>
                    {" · "}
                    <a
                      href={state.dmv_website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground"
                    >
                      {state.dmv_website_url}
                    </a>
                  </>
                )}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" render={<Link href={`/admin/states/${state.id}/edit`} />}>
                Edit
              </Button>
              <Button variant="destructive" onClick={() => del.request(state)}>
                Delete
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Link href={`/admin/quizzes?state_id=${state.id}`}>
              <StatCard title="Quizzes" value={quizzes?.meta.total ?? "—"} />
            </Link>
            <Link href={`/admin/cheat-sheets?state_id=${state.id}`}>
              <StatCard title="Cheat sheets" value={cheatSheets?.meta.total ?? "—"} />
            </Link>
            <Link href={`/admin/flashcards?state_id=${state.id}`}>
              <StatCard title="Flashcards" value={flashcards?.meta.total ?? "—"} />
            </Link>
            <Link href={`/admin/handbooks?state_id=${state.id}`}>
              <StatCard title="Handbooks" value={handbooks?.meta.total ?? "—"} />
            </Link>
            <Link href={`/admin/videos?state_id=${state.id}`}>
              <StatCard title="Videos" value={videos?.meta.total ?? "—"} />
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Quizzes <span className="font-normal text-muted-foreground">({quizzes?.meta.total ?? 0})</span>
              </CardTitle>
              <CardAction className="flex gap-2">
                <Button size="sm" variant="outline" render={<Link href={`/admin/quizzes?state_id=${state.id}`} />}>
                  View all
                </Button>
                <Button size="sm" render={<Link href="/admin/quizzes/create" />}>
                  Add quiz
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {quizzes && quizzes.data.length === 0 ? (
                <div className="text-sm text-muted-foreground">No quizzes for this state yet.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {(quizzes?.data ?? []).map((q) => (
                    <li key={q.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/admin/quizzes/${q.id}/edit`} className="font-medium hover:underline">
                            {q.title}
                          </Link>
                          <PremiumBadge isPremium={q.is_premium} />
                          {!q.is_active && <span className="text-xs text-neutral-500">Inactive</span>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {q.category?.title} · {q.total_questions} questions ·{" "}
                          {q.test_track === "permit_test" ? "Permit test" : "Driving test"}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" render={<Link href={`/admin/quizzes/${q.id}/questions`} />}>
                        Questions
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Cheat sheets <span className="font-normal text-muted-foreground">({cheatSheets?.meta.total ?? 0})</span>
              </CardTitle>
              <CardAction className="flex gap-2">
                <Button size="sm" variant="outline" render={<Link href={`/admin/cheat-sheets?state_id=${state.id}`} />}>
                  View all
                </Button>
                <Button size="sm" render={<Link href="/admin/cheat-sheets/create" />}>
                  Add cheat sheet
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {cheatSheets && cheatSheets.data.length === 0 ? (
                <div className="text-sm text-muted-foreground">No cheat sheets for this state yet.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {(cheatSheets?.data ?? []).map((c) => (
                    <li key={c.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/admin/cheat-sheets/${c.id}/edit`} className="font-medium hover:underline">
                            {c.title}
                          </Link>
                          <PremiumBadge isPremium={c.is_premium} />
                          {!c.is_active && <span className="text-xs text-neutral-500">Inactive</span>}
                        </div>
                        <p className="line-clamp-1 text-sm text-muted-foreground">{c.summary}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Flashcards <span className="font-normal text-muted-foreground">({flashcards?.meta.total ?? 0})</span>
              </CardTitle>
              <CardAction className="flex gap-2">
                <Button size="sm" variant="outline" render={<Link href={`/admin/flashcards?state_id=${state.id}`} />}>
                  View all
                </Button>
                <Button size="sm" render={<Link href="/admin/flashcards/create" />}>
                  Add flashcard
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {flashcards && flashcards.data.length === 0 ? (
                <div className="text-sm text-muted-foreground">No flashcards for this state yet.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {(flashcards?.data ?? []).map((c) => (
                    <li key={c.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/admin/flashcards/${c.id}/edit`} className="font-medium hover:underline">
                            {c.front_text}
                          </Link>
                          <PremiumBadge isPremium={c.is_premium} />
                          {!c.is_active && <span className="text-xs text-neutral-500">Inactive</span>}
                        </div>
                        <p className="line-clamp-1 text-sm text-muted-foreground">{c.back_text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Handbooks <span className="font-normal text-muted-foreground">({handbooks?.meta.total ?? 0})</span>
              </CardTitle>
              <CardAction className="flex gap-2">
                <Button size="sm" variant="outline" render={<Link href={`/admin/handbooks?state_id=${state.id}`} />}>
                  View all
                </Button>
                <Button size="sm" render={<Link href="/admin/handbooks/create" />}>
                  Add handbook
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {handbooks && handbooks.data.length === 0 ? (
                <div className="text-sm text-muted-foreground">No handbooks for this state yet.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {(handbooks?.data ?? []).map((h) => (
                    <li key={h.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/admin/handbooks/${h.id}/edit`} className="font-medium hover:underline">
                            {h.title}
                          </Link>
                          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs uppercase text-muted-foreground">
                            {h.language}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {h.vehicle_type?.title ?? "—"} · {h.chapters_count ?? 0} chapter{h.chapters_count === 1 ? "" : "s"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Videos <span className="font-normal text-muted-foreground">({videos?.meta.total ?? 0})</span>
              </CardTitle>
              <CardAction className="flex gap-2">
                <Button size="sm" variant="outline" render={<Link href={`/admin/videos?state_id=${state.id}`} />}>
                  View all
                </Button>
                <Button size="sm" render={<Link href="/admin/videos/create" />}>
                  Add video
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {videos && videos.data.length === 0 ? (
                <div className="text-sm text-muted-foreground">No videos for this state yet.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {(videos?.data ?? []).map((v) => (
                    <li key={v.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/admin/videos/${v.id}/edit`} className="font-medium hover:underline">
                            {v.title}
                          </Link>
                          <PremiumBadge isPremium={v.is_premium} />
                          {!v.is_active && <span className="text-xs text-neutral-500">Inactive</span>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {v.category?.title ?? "Any category"}
                          {v.duration_seconds && ` · ${Math.round(v.duration_seconds / 60)} min`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <ConfirmDeleteDialog
            open={del.open}
            onOpenChange={del.setOpen}
            title="Delete state?"
            description={
              del.error ??
              (del.target
                ? `Are you sure you want to delete "${del.target.name}"? This cannot be undone. States that still have quizzes cannot be deleted.`
                : "")
            }
            onConfirm={del.confirm}
          />
        </div>
      </AppLayout>
    </AdminGuard>
  );
}

export default function ViewStatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ViewStateInner id={id} />;
}
