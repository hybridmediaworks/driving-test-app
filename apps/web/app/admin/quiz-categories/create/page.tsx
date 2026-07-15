"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";

export default function CreateQuizCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [orderNo, setOrderNo] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      await api.post("/admin/quiz-categories", {
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

  return (
    <AdminGuard>
      <AppLayout
        breadcrumbs={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Quiz categories", href: "/admin/quiz-categories" },
          { title: "New", href: "/admin/quiz-categories/create" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">New category</h1>
            <p className="text-sm text-muted-foreground">Slug-style name, display title, order</p>
          </div>

          <form className="w-full max-w-xl space-y-6" onSubmit={submit}>
            <div className="grid gap-2">
              <Label htmlFor="name" className="gap-1">
                Name (slug) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                className="font-mono text-sm"
                placeholder="basics"
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Lowercase, e.g. <code>basics</code>, <code>intermediate</code>
              </p>
              <InputError message={errors.name?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title" className="gap-1">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input id="title" maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} />
              <InputError message={errors.title?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" rows={3} maxLength={10000} value={description} onChange={(e) => setDescription(e.target.value)} />
              <InputError message={errors.description?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="order_no">Order</Label>
              <Input
                id="order_no"
                type="number"
                min={0}
                value={orderNo}
                onChange={(e) => setOrderNo(Number(e.target.value))}
              />
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
                Create
              </Button>
              <Button variant="outline" type="button" render={<Link href="/admin/quiz-categories" />}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
