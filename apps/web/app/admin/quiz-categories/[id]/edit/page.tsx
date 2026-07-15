"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type FormEvent } from "react";
import type { QuizCategory } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";

export default function EditQuizCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [category, setCategory] = useState<QuizCategory | null>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [orderNo, setOrderNo] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.get<{ category: QuizCategory }>(`/admin/quiz-categories/${id}`).then((res) => {
      setCategory(res.category);
      setName(res.category.name);
      setTitle(res.category.title);
      setDescription(res.category.description ?? "");
      setOrderNo(res.category.order_no);
      setIsActive(res.category.is_active);
    });
  }, [id]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      await api.put(`/admin/quiz-categories/${id}`, {
        name,
        title,
        description: description || null,
        order_no: orderNo,
        is_active: isActive,
      });
      router.push("/admin/quiz-categories");
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
    } finally {
      setProcessing(false);
    }
  }

  if (!category) {
    return (
      <AdminGuard>
        <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Quiz categories", href: "/admin/quiz-categories" }]}>
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
          { title: "Quiz categories", href: "/admin/quiz-categories" },
          { title: "Edit", href: "/admin/quiz-categories" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">Edit category</h1>
            <p className="text-sm text-muted-foreground">{category.title}</p>
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

            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              <InputError message={errors.description?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="order_no">Order</Label>
              <Input id="order_no" type="number" min={0} value={orderNo} onChange={(e) => setOrderNo(Number(e.target.value))} />
              <InputError message={errors.order_no?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="is_active">Status</Label>
              <select
                id="is_active"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={isActive ? "true" : "false"}
                onChange={(e) => setIsActive(e.target.value === "true")}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <InputError message={errors.is_active?.[0]} />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={processing}>
                Save
              </Button>
              <Button variant="outline" type="button" render={<Link href="/admin/quiz-categories" />}>
                Back
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
