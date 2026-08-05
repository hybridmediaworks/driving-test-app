"use client";

import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { QuizCategory, State, VehicleType } from "@driving-test-app/shared";
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

export default function CreateCheatSheetPage() {
  const router = useRouter();
  const [options, setOptions] = useState<FormOptions | null>(null);

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
  const [sections, setSections] = useState<SectionDraft[]>([{ heading: "", body_markdown: "" }]);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.get<FormOptions>("/admin/cheat-sheets?per_page=1").then(setOptions);
  }, []);

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
    sections.forEach((section, i) => {
      formData.append(`sections[${i}][heading]`, section.heading);
      formData.append(`sections[${i}][body_markdown]`, section.body_markdown);
    });

    try {
      await api.post("/admin/cheat-sheets", formData);
      router.push("/admin/cheat-sheets");
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
    } finally {
      setProcessing(false);
    }
  }

  const sectionErrors = (index: number, field: keyof SectionDraft) => errors[`sections.${index}.${field}`]?.[0];

  return (
    <AdminGuard>
      <AppLayout
        breadcrumbs={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Cheat Sheets", href: "/admin/cheat-sheets" },
          { title: "New", href: "/admin/cheat-sheets/create" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">New cheat sheet</h1>
            <p className="text-sm text-muted-foreground">
              Leave category/state/vehicle blank for a sheet that applies universally.
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
                <option value="">Any category</option>
                {options?.categories.map((c) => (
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
                  {options?.states.map((s) => (
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
                  {options?.vehicle_types.map((v) => (
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
              <Label htmlFor="slug">Slug (optional)</Label>
              <Input
                id="slug"
                className="font-mono text-sm"
                placeholder="auto from title if empty"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <InputError message={errors.slug?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="summary" className="gap-1">
                Summary <span className="text-destructive">*</span>
              </Label>
              <Textarea id="summary" maxLength={500} value={summary} onChange={(e) => setSummary(e.target.value)} />
              <p className="text-xs text-muted-foreground">Shown as the teaser — visible even to non-premium visitors.</p>
              <InputError message={errors.summary?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cover_image">Cover image (optional)</Label>
              <input
                id="cover_image"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="text-sm"
                onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
              />
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
                    <p className="text-xs text-muted-foreground">
                      Use `- item` for bullet lists, blank lines between paragraphs.
                    </p>
                    <InputError message={sectionErrors(index, "body_markdown")} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={processing}>
                Create
              </Button>
              <Button variant="outline" type="button" render={<Link href="/admin/cheat-sheets" />}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
