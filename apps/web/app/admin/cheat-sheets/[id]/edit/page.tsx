"use client";

import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type FormEvent } from "react";
import type { CheatSheet, QuizCategory, State, VehicleType } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";

type FormOptions = {
  categories: Pick<QuizCategory, "id" | "name" | "title">[];
  states: State[];
  vehicle_types: Pick<VehicleType, "id" | "name" | "title">[];
};

type SectionDraft = { heading: string; body_markdown: string };

export default function EditCheatSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [options, setOptions] = useState<FormOptions | null>(null);
  const [cheatSheet, setCheatSheet] = useState<CheatSheet | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [stateId, setStateId] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [orderNo, setOrderNo] = useState(0);
  const [isPremium, setIsPremium] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [sections, setSections] = useState<SectionDraft[]>([{ heading: "", body_markdown: "" }]);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.get<FormOptions>("/admin/cheat-sheets?per_page=1").then(setOptions);
    api.get<{ cheat_sheet: CheatSheet }>(`/admin/cheat-sheets/${id}`).then((res) => {
      const c = res.cheat_sheet;
      setCheatSheet(c);
      setCategoryId(c.quiz_category_id != null ? String(c.quiz_category_id) : "");
      setStateId(c.state_id != null ? String(c.state_id) : "");
      setVehicleTypeId(c.vehicle_type_id != null ? String(c.vehicle_type_id) : "");
      setTitle(c.title);
      setSlug(c.slug);
      setSummary(c.summary);
      setOrderNo(c.order_no ?? 0);
      setIsPremium(c.is_premium);
      setIsActive(c.is_active);
      setSections(
        c.sections && c.sections.length > 0
          ? c.sections.map((s) => ({ heading: s.heading, body_markdown: s.body_markdown }))
          : [{ heading: "", body_markdown: "" }],
      );
    });
  }, [id]);

  function updateSection(index: number, field: keyof SectionDraft, value: string) {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function addSection() {
    setSections((prev) => [...prev, { heading: "", body_markdown: "" }]);
  }

  function removeSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    const formData = new FormData();
    formData.append("_method", "PUT");
    if (categoryId) formData.append("quiz_category_id", categoryId);
    if (stateId) formData.append("state_id", stateId);
    if (vehicleTypeId) formData.append("vehicle_type_id", vehicleTypeId);
    formData.append("title", title);
    if (slug) formData.append("slug", slug);
    formData.append("summary", summary);
    formData.append("order_no", String(orderNo));
    formData.append("is_premium", isPremium ? "1" : "0");
    formData.append("is_active", isActive ? "1" : "0");
    if (coverImage) formData.append("cover_image", coverImage);
    if (removeCover) formData.append("remove_cover_image", "1");
    sections.forEach((section, i) => {
      formData.append(`sections[${i}][heading]`, section.heading);
      formData.append(`sections[${i}][body_markdown]`, section.body_markdown);
    });

    try {
      await api.post(`/admin/cheat-sheets/${id}`, formData);
      router.push("/admin/cheat-sheets");
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
    } finally {
      setProcessing(false);
    }
  }

  const sectionErrors = (index: number, field: keyof SectionDraft) => errors[`sections.${index}.${field}`]?.[0];

  if (!cheatSheet || !options) {
    return (
      <AdminGuard>
        <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Cheat Sheets", href: "/admin/cheat-sheets" }]}>
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
          { title: "Cheat Sheets", href: "/admin/cheat-sheets" },
          { title: "Edit", href: "/admin/cheat-sheets" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">Edit cheat sheet</h1>
            <p className="text-sm text-muted-foreground">{cheatSheet.title}</p>
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
                <option value="">Any category</option>
                {options.categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.title}</option>
                ))}
              </select>
              <InputError message={errors.quiz_category_id?.[0]} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="state_id">State (optional)</Label>
                <select
                  id="state_id"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={stateId}
                  onChange={(e) => setStateId(e.target.value)}
                >
                  <option value="">All states</option>
                  {options.states.map((s) => (
                    <option key={s.id} value={String(s.id)}>{s.name} ({s.code})</option>
                  ))}
                </select>
                <InputError message={errors.state_id?.[0]} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vehicle_type_id">Vehicle (optional)</Label>
                <select
                  id="vehicle_type_id"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={vehicleTypeId}
                  onChange={(e) => setVehicleTypeId(e.target.value)}
                >
                  <option value="">All vehicles</option>
                  {options.vehicle_types.map((v) => (
                    <option key={v.id} value={String(v.id)}>{v.title}</option>
                  ))}
                </select>
                <InputError message={errors.vehicle_type_id?.[0]} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title" className="gap-1">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input id="title" maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} />
              <InputError message={errors.title?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" className="font-mono text-sm" value={slug} onChange={(e) => setSlug(e.target.value)} />
              <InputError message={errors.slug?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="summary" className="gap-1">
                Summary <span className="text-destructive">*</span>
              </Label>
              <Textarea id="summary" maxLength={500} value={summary} onChange={(e) => setSummary(e.target.value)} />
              <InputError message={errors.summary?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cover_image">Cover image</Label>
              {cheatSheet.cover_image_url && !removeCover && !coverImage && (
                <div className="overflow-hidden rounded-md border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cheatSheet.cover_image_url} alt="" className="h-32 w-auto object-cover" />
                </div>
              )}
              <input
                id="cover_image"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="text-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setCoverImage(file);
                  if (file) setRemoveCover(false);
                }}
              />
              {cheatSheet.cover_image_url && (
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={removeCover}
                    onChange={(e) => {
                      setRemoveCover(e.target.checked);
                      if (e.target.checked) setCoverImage(null);
                    }}
                  />
                  Remove current cover image
                </label>
              )}
              <InputError message={errors.cover_image?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="order_no">Sheet order</Label>
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
              <Label htmlFor="is_premium">Access</Label>
              <select
                id="is_premium"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={isPremium ? "true" : "false"}
                onChange={(e) => setIsPremium(e.target.value === "true")}
              >
                <option value="false">Free</option>
                <option value="true">Premium</option>
              </select>
              <InputError message={errors.is_premium?.[0]} />
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="gap-1">
                  Sections <span className="text-destructive">*</span>
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addSection}>
                  <Plus className="size-4" /> Add section
                </Button>
              </div>
              <InputError message={errors.sections?.[0]} />
              <p className="text-xs text-muted-foreground">
                Saving replaces the entire section list — editing content here clears the cached PDF so the next download regenerates.
              </p>

              {sections.map((section, index) => (
                <div key={index} className="space-y-3 rounded-md border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">Section {index + 1}</p>
                    {sections.length > 1 && (
                      <button
                        type="button"
                        className="text-destructive"
                        onClick={() => removeSection(index)}
                        aria-label="Remove section"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`section-${index}-heading`}>Heading</Label>
                    <Input
                      id={`section-${index}-heading`}
                      value={section.heading}
                      onChange={(e) => updateSection(index, "heading", e.target.value)}
                    />
                    <InputError message={sectionErrors(index, "heading")} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`section-${index}-body`}>Content (Markdown)</Label>
                    <Textarea
                      id={`section-${index}-body`}
                      rows={5}
                      value={section.body_markdown}
                      onChange={(e) => updateSection(index, "body_markdown", e.target.value)}
                    />
                    <InputError message={sectionErrors(index, "body_markdown")} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={processing}>
                Save
              </Button>
              <Button variant="outline" type="button" render={<Link href="/admin/cheat-sheets" />}>
                Back
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
