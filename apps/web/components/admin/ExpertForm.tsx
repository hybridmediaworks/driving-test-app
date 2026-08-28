"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { AdminExpert, ExpertSection } from "@driving-test-app/shared";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/ShadcnButton";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";

type Props =
  | { mode: "create"; expert?: undefined }
  | { mode: "edit"; expert: AdminExpert };

/**
 * Create / edit form for a reviewer profile (Expert). Shared by /admin/experts/create and
 * /admin/experts/[id]/edit. Always submits multipart (FormData) so a photo can ride along;
 * `sections` is an ordered, add/remove/reorder list of {heading, body} blocks.
 */
export default function ExpertForm({ mode, expert }: Props) {
  const router = useRouter();

  const [name, setName] = useState(expert?.name ?? "");
  const [slug, setSlug] = useState(expert?.slug ?? "");
  const [title, setTitle] = useState(expert?.title ?? "");
  const [credentials, setCredentials] = useState(expert?.credentials ?? "");
  const [roleLabel, setRoleLabel] = useState(expert?.role_label ?? "");
  const [intro, setIntro] = useState(expert?.intro ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(expert?.linkedin_url ?? "");
  const [email, setEmail] = useState(expert?.email ?? "");
  const [verifiedAt, setVerifiedAt] = useState(expert?.verified_at ?? "");
  const [sortOrder, setSortOrder] = useState(expert?.sort_order ?? 0);
  const [isPublished, setIsPublished] = useState(expert?.is_published ?? true);
  const [sections, setSections] = useState<ExpertSection[]>(expert?.sections ?? []);
  const [photo, setPhoto] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  function updateSection(index: number, patch: Partial<ExpertSection>) {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function moveSection(index: number, delta: number) {
    setSections((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    const form = new FormData();
    if (mode === "edit") form.append("_method", "PUT");
    form.append("name", name);
    form.append("slug", slug);
    form.append("title", title);
    form.append("credentials", credentials);
    form.append("role_label", roleLabel);
    form.append("intro", intro);
    form.append("linkedin_url", linkedinUrl);
    form.append("email", email);
    form.append("verified_at", verifiedAt);
    form.append("sort_order", String(sortOrder));
    form.append("is_published", isPublished ? "1" : "0");
    sections.forEach((section, i) => {
      form.append(`sections[${i}][heading]`, section.heading);
      form.append(`sections[${i}][body]`, section.body);
    });
    if (photo) form.append("photo", photo);
    if (removePhoto) form.append("remove_photo", "1");

    try {
      if (mode === "edit") {
        await api.post<{ expert: AdminExpert }>(`/admin/experts/${expert.id}`, form);
      } else {
        await api.post<{ expert: AdminExpert }>("/admin/experts", form);
      }
      router.push("/admin/experts");
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form className="w-full max-w-2xl space-y-6" onSubmit={submit}>
      <div className="grid gap-2">
        <Label htmlFor="name" className="gap-1">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input id="name" maxLength={255} value={name} onChange={(e) => setName(e.target.value)} />
        <InputError message={errors.name?.[0]} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          className="font-mono text-sm"
          placeholder={mode === "create" ? "Auto-generated from the name" : undefined}
          maxLength={255}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          The public URL is <code className="text-xs">/experts/{slug || "…"}</code>. Changing it breaks existing links.
        </p>
        <InputError message={errors.slug?.[0]} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="title" className="gap-1">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g. Lead DMV Content Reviewer"
          maxLength={255}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <InputError message={errors.title?.[0]} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="credentials">Credentials line</Label>
        <Input
          id="credentials"
          placeholder="e.g. M.S., Lead DMV Content Reviewer (ACES member)"
          maxLength={255}
          value={credentials}
          onChange={(e) => setCredentials(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Shown next to the name on state/quiz trust badges. Falls back to the title.</p>
        <InputError message={errors.credentials?.[0]} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="role_label">Trust-block heading</Label>
        <Input
          id="role_label"
          placeholder="e.g. Reviewed for legal and handbook accuracy"
          maxLength={255}
          value={roleLabel}
          onChange={(e) => setRoleLabel(e.target.value)}
        />
        <InputError message={errors.role_label?.[0]} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="intro">Intro / bio</Label>
        <Textarea id="intro" rows={5} value={intro} onChange={(e) => setIntro(e.target.value)} />
        <p className="text-xs text-muted-foreground">Opening paragraph(s) on the profile page. Leave a blank line between paragraphs.</p>
        <InputError message={errors.intro?.[0]} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="linkedin_url">LinkedIn URL</Label>
          <Input id="linkedin_url" type="url" placeholder="https://…" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
          <InputError message={errors.linkedin_url?.[0]} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Contact email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <InputError message={errors.email?.[0]} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="verified_at" className="gap-1">
            Last verified on <span className="text-destructive">*</span>
          </Label>
          <Input id="verified_at" type="date" value={verifiedAt} onChange={(e) => setVerifiedAt(e.target.value)} />
          <InputError message={errors.verified_at?.[0]} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sort_order">Sort order</Label>
          <Input
            id="sort_order"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
          />
          <InputError message={errors.sort_order?.[0]} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="is_published">Status</Label>
          <select
            id="is_published"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={isPublished ? "true" : "false"}
            onChange={(e) => setIsPublished(e.target.value === "true")}
          >
            <option value="true">Published</option>
            <option value="false">Hidden</option>
          </select>
          <InputError message={errors.is_published?.[0]} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="photo">Photo</Label>
        {expert?.photo_url && !removePhoto && !photo && (
          <div className="h-20 w-20 overflow-hidden rounded-full border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={expert.photo_url} alt="" className="h-20 w-20 object-cover" />
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
        {expert?.photo_url && (
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

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Profile sections</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSections((prev) => [...prev, { heading: "", body: "" }])}
          >
            Add section
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          e.g. Education, Areas of expertise, Methodology, Editorial policy, Publications. In a body, a line starting with{" "}
          <code className="text-xs">- </code> becomes a bullet; a blank line starts a new paragraph.
        </p>

        {sections.length === 0 && <div className="text-sm text-muted-foreground">No sections yet.</div>}

        {sections.map((section, i) => (
          <div key={i} className="space-y-2 rounded-md border border-border p-3">
            <div className="flex items-center gap-2">
              <Input
                aria-label={`Section ${i + 1} heading`}
                placeholder="Section heading"
                value={section.heading}
                onChange={(e) => updateSection(i, { heading: e.target.value })}
              />
              <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => moveSection(i, -1)}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={i === sections.length - 1}
                onClick={() => moveSection(i, 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setSections((prev) => prev.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <Textarea
              aria-label={`Section ${i + 1} body`}
              rows={4}
              placeholder="Section body"
              value={section.body}
              onChange={(e) => updateSection(i, { body: e.target.value })}
            />
            <InputError message={errors[`sections.${i}.heading`]?.[0] ?? errors[`sections.${i}.body`]?.[0]} />
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={processing}>
          {mode === "edit" ? "Save" : "Create"}
        </Button>
        <Button variant="outline" type="button" render={<Link href="/admin/experts" />}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
