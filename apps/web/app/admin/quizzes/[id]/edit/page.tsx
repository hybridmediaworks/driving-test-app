"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type FormEvent } from "react";
import type { Quiz, QuizCategory, QuizType, State, VehicleType } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { api, ApiError } from "@/lib/api";

type FormOptions = {
  categories: Pick<QuizCategory, "id" | "name" | "title">[];
  quizTypes: QuizType[];
  states: State[];
  vehicleTypes: Pick<VehicleType, "id" | "name" | "title">[];
};

export default function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [options, setOptions] = useState<FormOptions | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [quizTypeId, setQuizTypeId] = useState("");
  const [stateId, setStateId] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [orderNo, setOrderNo] = useState(0);
  const [testTrack, setTestTrack] = useState<"permit_test" | "driving_test">("permit_test");
  const [durationSeconds, setDurationSeconds] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.get<FormOptions>("/admin/quizzes?per_page=1").then(setOptions);
    api.get<{ quiz: Quiz }>(`/admin/quizzes/${id}`).then((res) => {
      const q = res.quiz;
      setQuiz(q);
      setCategoryId(String(q.quiz_category_id));
      setQuizTypeId(String(q.quiz_type_id));
      setStateId(String(q.state_id));
      setVehicleTypeId(String(q.vehicle_type_id));
      setTitle(q.title);
      setSlug(q.slug);
      setOrderNo(q.order_no ?? 0);
      setTestTrack(q.test_track);
      setDurationSeconds(q.duration_seconds != null ? String(q.duration_seconds) : "");
      setIsPremium(q.is_premium);
      setIsActive(q.is_active);
    });
  }, [id]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    const formData = new FormData();
    formData.append("_method", "PUT");
    formData.append("quiz_category_id", categoryId);
    formData.append("quiz_type_id", quizTypeId);
    formData.append("state_id", stateId);
    formData.append("vehicle_type_id", vehicleTypeId);
    formData.append("title", title);
    if (slug) formData.append("slug", slug);
    formData.append("order_no", String(orderNo));
    formData.append("test_track", testTrack);
    if (durationSeconds) formData.append("duration_seconds", durationSeconds);
    formData.append("is_premium", isPremium ? "1" : "0");
    formData.append("is_active", isActive ? "1" : "0");
    if (coverImage) formData.append("cover_image", coverImage);
    if (removeCover) formData.append("remove_cover_image", "1");

    try {
      await api.post(`/admin/quizzes/${id}`, formData);
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

  if (!quiz || !options) {
    return (
      <AdminGuard>
        <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Quizzes", href: "/admin/quizzes" }]}>
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
          { title: "Quizzes", href: "/admin/quizzes" },
          { title: "Edit", href: "/admin/quizzes" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">Edit quiz</h1>
            <p className="text-sm text-muted-foreground">{quiz.title}</p>
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
                {options.categories.map((c) => (
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
                {options.quizTypes.map((t) => (
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
                  {options.states.map((s) => (
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
                  {options.vehicleTypes.map((v) => (
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
              <Label htmlFor="cover_image">Cover image</Label>
              {quiz.cover_image_url && !removeCover && !coverImage && (
                <div className="overflow-hidden rounded-md border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={quiz.cover_image_url} alt="" className="h-32 w-auto object-cover" />
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
              {coverImage && (
                <p className="text-xs text-muted-foreground">
                  {coverImage.name}{" "}
                  <button type="button" className="text-foreground underline" onClick={() => setCoverImage(null)}>
                    Clear
                  </button>
                </p>
              )}
              {quiz.cover_image_url && (
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
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
              />
              <InputError message={errors.duration_seconds?.[0]} />
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
                Save
              </Button>
              <Button variant="outline" type="button" render={<Link href="/admin/quizzes" />}>
                Back
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
