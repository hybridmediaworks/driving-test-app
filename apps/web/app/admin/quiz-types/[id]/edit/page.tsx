"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type FormEvent } from "react";
import type { QuizType } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { api, ApiError } from "@/lib/api";

export default function EditQuizTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [quizType, setQuizType] = useState<QuizType | null>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.get<{ quiz_type: QuizType }>(`/admin/quiz-types/${id}`).then((res) => {
      setQuizType(res.quiz_type);
      setName(res.quiz_type.name);
      setTitle(res.quiz_type.title);
    });
  }, [id]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      await api.put(`/admin/quiz-types/${id}`, { name, title });
      router.push("/admin/quiz-types");
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
    } finally {
      setProcessing(false);
    }
  }

  if (!quizType) {
    return (
      <AdminGuard>
        <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Quiz types", href: "/admin/quiz-types" }]}>
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
          { title: "Quiz types", href: "/admin/quiz-types" },
          { title: "Edit", href: "/admin/quiz-types" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">Edit quiz type</h1>
            <p className="text-sm text-muted-foreground">{quizType.title}</p>
          </div>

          <form className="w-full max-w-xl space-y-6" onSubmit={submit}>
            <div className="grid gap-2">
              <Label htmlFor="name" className="gap-1">
                Name (slug) <span className="text-destructive">*</span>
              </Label>
              <Input id="name" className="font-mono text-sm" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
              <InputError message={errors.name?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title" className="gap-1">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <InputError message={errors.title?.[0]} />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={processing}>
                Save
              </Button>
              <Button variant="outline" type="button" render={<Link href="/admin/quiz-types" />}>
                Back
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
