"use client";

import Link from "next/link";
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

export default function CreateFlashcardPage() {
  const router = useRouter();
  const [options, setOptions] = useState<FormOptions | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [stateId, setStateId] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");
  const [topic, setTopic] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isPremium, setIsPremium] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.get<FormOptions>("/admin/flashcards?per_page=1").then(setOptions);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    const formData = new FormData();
    if (categoryId) formData.append("quiz_category_id", categoryId);
    if (stateId) formData.append("state_id", stateId);
    if (vehicleTypeId) formData.append("vehicle_type_id", vehicleTypeId);
    formData.append("front_text", frontText);
    formData.append("back_text", backText);
    if (topic) formData.append("topic", topic);
    formData.append("sort_order", String(sortOrder));
    formData.append("is_premium", isPremium ? "1" : "0");
    formData.append("is_active", isActive ? "1" : "0");
    if (image) formData.append("image", image);

    try {
      await api.post("/admin/flashcards", formData);
      router.push("/admin/flashcards");
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
          { title: "Flashcards", href: "/admin/flashcards" },
          { title: "New", href: "/admin/flashcards/create" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">New flashcard</h1>
            <p className="text-sm text-muted-foreground">
              Leave category/state/vehicle blank for a card that applies universally (e.g. a federally standardized road sign).
            </p>
          </div>

          <form className="w-full max-w-xl space-y-6" onSubmit={submit}>
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
              <Label htmlFor="front_text" className="gap-1">
                Front <span className="text-destructive">*</span>
              </Label>
              <Textarea id="front_text" maxLength={500} value={frontText} onChange={(e) => setFrontText(e.target.value)} />
              <InputError message={errors.front_text?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="back_text" className="gap-1">
                Back <span className="text-destructive">*</span>
              </Label>
              <Textarea id="back_text" maxLength={5000} value={backText} onChange={(e) => setBackText(e.target.value)} />
              <InputError message={errors.back_text?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="topic">Topic (optional)</Label>
              <Input id="topic" maxLength={255} value={topic} onChange={(e) => setTopic(e.target.value)} />
              <InputError message={errors.topic?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">Image (optional)</Label>
              <p className="text-xs text-muted-foreground">JPEG, PNG, GIF, or WebP, max 5 MB. E.g. a road-sign graphic.</p>
              <input
                id="image"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="text-sm"
                onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              />
              <InputError message={errors.image?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sort_order">Card order</Label>
              <Input
                id="sort_order"
                type="number"
                min={0}
                max={999999}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
              <InputError message={errors.sort_order?.[0]} />
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
              <Button variant="outline" type="button" render={<Link href="/admin/flashcards" />}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
