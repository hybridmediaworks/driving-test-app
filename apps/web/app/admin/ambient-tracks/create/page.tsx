"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { QuizCategory } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { api, ApiError } from "@/lib/api";

type FormOptions = {
  categories: Pick<QuizCategory, "id" | "name" | "title">[];
};

type SourceType = "external" | "disk";

export default function CreateAmbientTrackPage() {
  const router = useRouter();
  const [options, setOptions] = useState<FormOptions | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("external");
  const [externalUrl, setExternalUrl] = useState("");
  const [disk, setDisk] = useState("");
  const [path, setPath] = useState("");
  const [orderNo, setOrderNo] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.get<FormOptions>("/admin/ambient-tracks?per_page=1").then(setOptions);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    const payload: Record<string, unknown> = {
      quiz_category_id: categoryId ? Number(categoryId) : null,
      title,
      order_no: orderNo,
      is_active: isActive,
    };
    if (sourceType === "external") {
      payload.external_url = externalUrl;
    } else {
      payload.disk = disk;
      payload.path = path;
    }

    try {
      await api.post("/admin/ambient-tracks", payload);
      router.push("/admin/ambient-tracks");
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
          { title: "Ambient Tracks", href: "/admin/ambient-tracks" },
          { title: "New", href: "/admin/ambient-tracks/create" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">New ambient track</h1>
            <p className="text-sm text-muted-foreground">
              Leave category blank for a track that plays for every quiz (global).
            </p>
          </div>

          <form className="w-full max-w-2xl space-y-6" onSubmit={submit}>
            <div className="grid gap-2">
              <Label htmlFor="quiz_category_id">Category (optional)</Label>
              <select
                id="quiz_category_id"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Every category (global)</option>
                {options?.categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.title}</option>
                ))}
              </select>
              <InputError message={errors.quiz_category_id?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title" className="gap-1">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input id="title" maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} />
              <InputError message={errors.title?.[0]} />
            </div>

            <div className="space-y-3 rounded-md border border-border p-4">
              <Label className="gap-1">
                Audio source <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-4 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="source_type"
                    checked={sourceType === "external"}
                    onChange={() => setSourceType("external")}
                  />
                  External URL
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="source_type" checked={sourceType === "disk"} onChange={() => setSourceType("disk")} />
                  Disk + path
                </label>
              </div>

              {sourceType === "external" ? (
                <div className="grid gap-2">
                  <Label htmlFor="external_url">External URL</Label>
                  <Input
                    id="external_url"
                    placeholder="https://... (direct mp3 link)"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                  />
                  <InputError message={errors.external_url?.[0]} />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="disk">Disk</Label>
                    <Input id="disk" placeholder="e.g. s3" value={disk} onChange={(e) => setDisk(e.target.value)} />
                    <InputError message={errors.disk?.[0]} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="path">Path</Label>
                    <Input
                      id="path"
                      placeholder="ambient-music/example.mp3"
                      value={path}
                      onChange={(e) => setPath(e.target.value)}
                    />
                    <InputError message={errors.path?.[0]} />
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="order_no">Track order</Label>
              <Input
                id="order_no"
                type="number"
                min={0}
                max={999999}
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
              <Button variant="outline" type="button" render={<Link href="/admin/ambient-tracks" />}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
