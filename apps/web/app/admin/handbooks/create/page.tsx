"use client";

import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { State, VehicleType } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";

type FormOptions = {
  states: State[];
  vehicle_types: Pick<VehicleType, "id" | "name" | "title">[];
};

type SectionDraft = { heading: string; content: string };
type ChapterDraft = { title: string; sections: SectionDraft[] };

function emptySection(): SectionDraft {
  return { heading: "", content: "" };
}

function emptyChapter(): ChapterDraft {
  return { title: "", sections: [emptySection()] };
}

export default function CreateHandbookPage() {
  const router = useRouter();
  const [options, setOptions] = useState<FormOptions | null>(null);

  const [stateId, setStateId] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [language, setLanguage] = useState("en");
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [totalWords, setTotalWords] = useState("");
  const [pdf, setPdf] = useState<File | null>(null);
  const [chapters, setChapters] = useState<ChapterDraft[]>([emptyChapter()]);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.get<FormOptions>("/admin/handbooks?per_page=1").then(setOptions);
  }, []);

  function updateChapterTitle(index: number, value: string) {
    setChapters((prev) => prev.map((c, i) => (i === index ? { ...c, title: value } : c)));
  }

  function addChapter() {
    setChapters((prev) => [...prev, emptyChapter()]);
  }

  function removeChapter(index: number) {
    setChapters((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSection(chapterIndex: number, sectionIndex: number, field: keyof SectionDraft, value: string) {
    setChapters((prev) =>
      prev.map((c, i) =>
        i === chapterIndex
          ? { ...c, sections: c.sections.map((s, j) => (j === sectionIndex ? { ...s, [field]: value } : s)) }
          : c,
      ),
    );
  }

  function addSection(chapterIndex: number) {
    setChapters((prev) => prev.map((c, i) => (i === chapterIndex ? { ...c, sections: [...c.sections, emptySection()] } : c)));
  }

  function removeSection(chapterIndex: number, sectionIndex: number) {
    setChapters((prev) =>
      prev.map((c, i) => (i === chapterIndex ? { ...c, sections: c.sections.filter((_, j) => j !== sectionIndex) } : c)),
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    const formData = new FormData();
    formData.append("state_id", stateId);
    formData.append("vehicle_type_id", vehicleTypeId);
    formData.append("language", language);
    formData.append("title", title);
    if (sourceUrl) formData.append("source_url", sourceUrl);
    if (totalWords) formData.append("total_words", totalWords);
    if (pdf) formData.append("pdf", pdf);
    chapters.forEach((chapter, i) => {
      formData.append(`chapters[${i}][title]`, chapter.title);
      chapter.sections.forEach((section, j) => {
        formData.append(`chapters[${i}][sections][${j}][heading]`, section.heading);
        formData.append(`chapters[${i}][sections][${j}][content]`, section.content);
      });
    });

    try {
      await api.post("/admin/handbooks", formData);
      router.push("/admin/handbooks");
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
    } finally {
      setProcessing(false);
    }
  }

  const chapterError = (index: number, field: "title" | "sections") => errors[`chapters.${index}.${field}`]?.[0];
  const sectionError = (chapterIndex: number, sectionIndex: number, field: keyof SectionDraft) =>
    errors[`chapters.${chapterIndex}.sections.${sectionIndex}.${field}`]?.[0];

  return (
    <AdminGuard>
      <AppLayout
        breadcrumbs={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Handbooks", href: "/admin/handbooks" },
          { title: "New", href: "/admin/handbooks/create" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">New handbook</h1>
            <p className="text-sm text-muted-foreground">One handbook per state, vehicle type, and language combination.</p>
          </div>

          <form className="w-full max-w-2xl space-y-6" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="state_id" className="gap-1">
                  State <span className="text-destructive">*</span>
                </Label>
                <select
                  id="state_id"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={stateId}
                  onChange={(e) => setStateId(e.target.value)}
                >
                  <option value="" disabled>Select</option>
                  {options?.states.map((s) => (
                    <option key={s.id} value={String(s.id)}>{s.name} ({s.code})</option>
                  ))}
                </select>
                <InputError message={errors.state_id?.[0]} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vehicle_type_id" className="gap-1">
                  Vehicle <span className="text-destructive">*</span>
                </Label>
                <select
                  id="vehicle_type_id"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={vehicleTypeId}
                  onChange={(e) => setVehicleTypeId(e.target.value)}
                >
                  <option value="" disabled>Select</option>
                  {options?.vehicle_types.map((v) => (
                    <option key={v.id} value={String(v.id)}>{v.title}</option>
                  ))}
                </select>
                <InputError message={errors.vehicle_type_id?.[0]} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="language" className="gap-1">
                Language <span className="text-destructive">*</span>
              </Label>
              <Input id="language" maxLength={50} placeholder="en" value={language} onChange={(e) => setLanguage(e.target.value)} />
              <InputError message={errors.language?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title" className="gap-1">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input id="title" maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} />
              <InputError message={errors.title?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="source_url">Source URL (optional)</Label>
              <Input id="source_url" placeholder="https://..." value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
              <InputError message={errors.source_url?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="total_words">Total words (optional)</Label>
              <Input
                id="total_words"
                type="number"
                min={0}
                value={totalWords}
                onChange={(e) => setTotalWords(e.target.value)}
              />
              <InputError message={errors.total_words?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pdf">PDF (optional)</Label>
              <p className="text-xs text-muted-foreground">Max 50 MB.</p>
              <input
                id="pdf"
                type="file"
                accept="application/pdf"
                className="text-sm"
                onChange={(e) => setPdf(e.target.files?.[0] ?? null)}
              />
              <InputError message={errors.pdf?.[0]} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="gap-1">
                  Chapters <span className="text-destructive">*</span>
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addChapter}>
                  <Plus className="size-4" /> Add chapter
                </Button>
              </div>
              <InputError message={errors.chapters?.[0]} />

              {chapters.map((chapter, chapterIndex) => (
                <div key={chapterIndex} className="space-y-3 rounded-md border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid w-full gap-2">
                      <Label htmlFor={`chapter-${chapterIndex}-title`}>Chapter {chapterIndex + 1} title</Label>
                      <Input
                        id={`chapter-${chapterIndex}-title`}
                        value={chapter.title}
                        onChange={(e) => updateChapterTitle(chapterIndex, e.target.value)}
                      />
                      <InputError message={chapterError(chapterIndex, "title")} />
                    </div>
                    {chapters.length > 1 && (
                      <button
                        type="button"
                        className="mt-6 shrink-0 text-destructive"
                        onClick={() => removeChapter(chapterIndex)}
                        aria-label="Remove chapter"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 pl-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">Sections</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => addSection(chapterIndex)}>
                        <Plus className="size-4" /> Add section
                      </Button>
                    </div>
                    <InputError message={chapterError(chapterIndex, "sections")} />

                    {chapter.sections.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="space-y-3 rounded-md border border-border p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-muted-foreground">Section {sectionIndex + 1}</p>
                          {chapter.sections.length > 1 && (
                            <button
                              type="button"
                              className="text-destructive"
                              onClick={() => removeSection(chapterIndex, sectionIndex)}
                              aria-label="Remove section"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`chapter-${chapterIndex}-section-${sectionIndex}-heading`}>Heading (optional)</Label>
                          <Input
                            id={`chapter-${chapterIndex}-section-${sectionIndex}-heading`}
                            value={section.heading}
                            onChange={(e) => updateSection(chapterIndex, sectionIndex, "heading", e.target.value)}
                          />
                          <InputError message={sectionError(chapterIndex, sectionIndex, "heading")} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`chapter-${chapterIndex}-section-${sectionIndex}-content`}>Content</Label>
                          <Textarea
                            id={`chapter-${chapterIndex}-section-${sectionIndex}-content`}
                            rows={4}
                            value={section.content}
                            onChange={(e) => updateSection(chapterIndex, sectionIndex, "content", e.target.value)}
                          />
                          <InputError message={sectionError(chapterIndex, sectionIndex, "content")} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={processing}>
                Create
              </Button>
              <Button variant="outline" type="button" render={<Link href="/admin/handbooks" />}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
