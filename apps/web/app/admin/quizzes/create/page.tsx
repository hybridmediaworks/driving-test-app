"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { QuizCategory, QuizType, State, VehicleType } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { api, ApiError } from "@/lib/api";

type FormOptions = {
  categories: Pick<QuizCategory, "id" | "name" | "title">[];
  quiz_types: QuizType[];
  states: State[];
  vehicle_types: Pick<VehicleType, "id" | "name" | "title">[];
};

export default function CreateQuizPage() {
  const router = useRouter();
  const [options, setOptions] = useState<FormOptions | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [quizTypeId, setQuizTypeId] = useState("");
  const [stateId, setStateId] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [orderNo, setOrderNo] = useState(0);
  const [testTrack, setTestTrack] = useState<"permit_test" | "driving_test">("permit_test");
  const [durationSeconds, setDurationSeconds] = useState("");
  const [passingScorePercent, setPassingScorePercent] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.get<FormOptions>("/admin/quizzes?per_page=1").then(setOptions);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    const formData = new FormData();
    formData.append("quiz_category_id", categoryId);
    formData.append("quiz_type_id", quizTypeId);
    formData.append("state_id", stateId);
    formData.append("vehicle_type_id", vehicleTypeId);
    formData.append("title", title);
    if (slug) formData.append("slug", slug);
    formData.append("order_no", String(orderNo));
    formData.append("test_track", testTrack);
    if (durationSeconds) formData.append("duration_seconds", durationSeconds);
    if (passingScorePercent) formData.append("passing_score_percent", passingScorePercent);
    formData.append("is_premium", isPremium ? "1" : "0");
    formData.append("is_active", isActive ? "1" : "0");
    if (coverImage) formData.append("cover_image", coverImage);

    try {
      await api.post("/admin/quizzes", formData);
      router.push("/admin/quizzes");
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
    } finally {
      setProcessing(false);
    }
  }

  const coverFieldErrors = Object.entries(errors)
    .filter(([k]) => k.startsWith("cover_image"))
    .flatMap(([, v]) => v);

  return (
    <AdminGuard>
      <AppLayout
        breadcrumbs={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Quizzes", href: "/admin/quizzes" },
          { title: "New", href: "/admin/quizzes/create" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">New quiz</h1>
            <p className="text-sm text-muted-foreground">Link to a category and quiz type</p>
          </div>

          <form className="w-full max-w-xl space-y-6" onSubmit={submit}>
            <div className="grid gap-2">
              <Label htmlFor="quiz_category_id" className="gap-1">
                Category <span className="text-destructive">*</span>
              </Label>
              <select
                id="quiz_category_id"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="" disabled>Select</option>
                {options?.categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.title}</option>
                ))}
              </select>
              <InputError message={errors.quiz_category_id?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quiz_type_id" className="gap-1">
                Quiz type <span className="text-destructive">*</span>
              </Label>
              <select
                id="quiz_type_id"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={quizTypeId}
                onChange={(e) => setQuizTypeId(e.target.value)}
              >
                <option value="" disabled>Select</option>
                {options?.quiz_types.map((t) => (
                  <option key={t.id} value={String(t.id)}>{t.title}</option>
                ))}
              </select>
              <InputError message={errors.quiz_type_id?.[0]} />
            </div>

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
              <Label htmlFor="cover_image">Cover image (optional)</Label>
              <p className="text-xs text-muted-foreground">JPEG, PNG, GIF, or WebP, max 5 MB. Shown as the quiz card image in the app.</p>
              <input
                id="cover_image"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="text-sm"
                onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
              />
              {coverImage && (
                <p className="text-xs text-muted-foreground">
                  {coverImage.name}{" "}
                  <button type="button" className="text-foreground underline" onClick={() => setCoverImage(null)}>
                    Clear
                  </button>
                </p>
              )}
              <InputError message={errors.cover_image?.[0]} />
              {coverFieldErrors.map((err, i) => (
                <InputError key={i} message={err} />
              ))}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="order_no">Quiz order</Label>
              <Input
                id="order_no"
                type="number"
                min={0}
                max={999999}
                value={orderNo}
                onChange={(e) => setOrderNo(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Lower numbers appear first in lists (within filters). Same as category ordering.</p>
              <InputError message={errors.order_no?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="test_track" className="gap-1">
                Track <span className="text-destructive">*</span>
              </Label>
              <select
                id="test_track"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={testTrack}
                onChange={(e) => setTestTrack(e.target.value as "permit_test" | "driving_test")}
              >
                <option value="permit_test">Permit Test</option>
                <option value="driving_test">Driving Test</option>
              </select>
              <InputError message={errors.test_track?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="duration_seconds">Duration (seconds, optional)</Label>
              <Input
                id="duration_seconds"
                type="number"
                min={1}
                placeholder="e.g. 1800 for 30 min"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
              />
              <InputError message={errors.duration_seconds?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="passing_score_percent">Passing score % (optional)</Label>
              <Input
                id="passing_score_percent"
                type="number"
                min={1}
                max={100}
                placeholder="e.g. 80 for exam-simulator quizzes"
                value={passingScorePercent}
                onChange={(e) => setPassingScorePercent(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Only meaningful for &quot;Final Exam Simulation&quot; quizzes — leave blank for practice quizzes with no pass/fail result.
              </p>
              <InputError message={errors.passing_score_percent?.[0]} />
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

            <div className="flex gap-3">
              <Button type="submit" disabled={processing}>
                Create
              </Button>
              <Button variant="outline" type="button" render={<Link href="/admin/quizzes" />}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
