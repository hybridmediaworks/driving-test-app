"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { ReviewerProfile } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { api, ApiError } from "@/lib/api";

/**
 * Singleton settings page — there's only ever one reviewer profile (the "Accuracy verified by …"
 * trust badge shown on state pages and quiz pages), so this is one edit form, no list/create.
 */
export default function ReviewerProfilePage() {
  const [reviewer, setReviewer] = useState<ReviewerProfile | null>(null);

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [verifiedAt, setVerifiedAt] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.get<{ reviewer: ReviewerProfile }>("/admin/reviewer-profile").then((res) => {
      setReviewer(res.reviewer);
      setName(res.reviewer.name);
      setTitle(res.reviewer.title);
      setVerifiedAt(res.reviewer.verified_at);
    });
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});
    setSaved(false);

    const formData = new FormData();
    formData.append("_method", "PUT");
    formData.append("name", name);
    formData.append("title", title);
    formData.append("verified_at", verifiedAt);
    if (photo) formData.append("photo", photo);
    if (removePhoto) formData.append("remove_photo", "1");

    try {
      const res = await api.post<{ reviewer: ReviewerProfile }>("/admin/reviewer-profile", formData);
      setReviewer(res.reviewer);
      setPhoto(null);
      setRemovePhoto(false);
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
    } finally {
      setProcessing(false);
    }
  }

  if (!reviewer) {
    return (
      <AdminGuard>
        <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Reviewer Profile", href: "/admin/reviewer-profile" }]}>
          <div className="app-page text-sm text-muted-foreground">Loading…</div>
        </AppLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Reviewer Profile", href: "/admin/reviewer-profile" }]}>
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">Reviewer profile</h1>
            <p className="text-sm text-muted-foreground">
              The &quot;Accuracy verified by …&quot; trust badge shown on state pages and quiz pages —
              one profile, site-wide.
            </p>
          </div>

          <form className="w-full max-w-2xl space-y-6" onSubmit={submit}>
            <div className="grid gap-2">
              <Label htmlFor="name" className="gap-1">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input id="name" maxLength={255} value={name} onChange={(e) => setName(e.target.value)} />
              <InputError message={errors.name?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title" className="gap-1">
                Title / credentials <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. DMV Test-Prep Editor"
                maxLength={255}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <InputError message={errors.title?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="verified_at" className="gap-1">
                Last verified on <span className="text-destructive">*</span>
              </Label>
              <Input
                id="verified_at"
                type="date"
                value={verifiedAt}
                onChange={(e) => setVerifiedAt(e.target.value)}
              />
              <InputError message={errors.verified_at?.[0]} />
              <p className="text-xs text-muted-foreground">
                Update this whenever you actually redo an accuracy pass — it&apos;s shown as &quot;Accuracy
                verified {"{"}month{"}"} {"{"}year{"}"} by {"{"}name{"}"}&quot;.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="photo">Photo</Label>
              {reviewer.photo_url && !removePhoto && !photo && (
                <div className="overflow-hidden rounded-full border border-border w-20 h-20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={reviewer.photo_url} alt="" className="h-20 w-20 object-cover" />
                </div>
              )}
              <input
                id="photo"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="text-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setPhoto(file);
                  if (file) setRemovePhoto(false);
                }}
              />
              {reviewer.photo_url && (
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={removePhoto}
                    onChange={(e) => {
                      setRemovePhoto(e.target.checked);
                      if (e.target.checked) setPhoto(null);
                    }}
                  />
                  Remove current photo
                </label>
              )}
              <InputError message={errors.photo?.[0]} />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={processing}>
                Save
              </Button>
              {saved && <span className="text-sm text-muted-foreground">Saved.</span>}
            </div>
          </form>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
