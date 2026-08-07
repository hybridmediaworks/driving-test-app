"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type FormEvent } from "react";
import type { QuizCategory, State, VehicleType, Video } from "@driving-test-app/shared";
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

type SourceType = "external" | "disk";

export default function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [options, setOptions] = useState<FormOptions | null>(null);
  const [video, setVideo] = useState<Video | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [stateId, setStateId] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [testTrack, setTestTrack] = useState<"" | "permit_test" | "driving_test">("");
  const [section, setSection] = useState("");
  const [subsection, setSubsection] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("external");
  const [externalUrl, setExternalUrl] = useState("");
  const [disk, setDisk] = useState("");
  const [path, setPath] = useState("");
  const [orderNo, setOrderNo] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [removeThumbnail, setRemoveThumbnail] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.get<FormOptions>("/admin/videos?per_page=1").then(setOptions);
    api.get<{ video: Video }>(`/admin/videos/${id}`).then((res) => {
      const v = res.video;
      setVideo(v);
      setCategoryId(v.quiz_category_id != null ? String(v.quiz_category_id) : "");
      setStateId(v.state_id != null ? String(v.state_id) : "");
      setVehicleTypeId(v.vehicle_type_id != null ? String(v.vehicle_type_id) : "");
      setTestTrack(v.test_track ?? "");
      setSection(v.section ?? "");
      setSubsection(v.subsection ?? "");
      setTitle(v.title);
      setSlug(v.slug);
      setDescription(v.description ?? "");
      setDurationSeconds(v.duration_seconds != null ? String(v.duration_seconds) : "");
      setSourceUrl(v.source_url ?? "");
      setSourceType(v.external_url ? "external" : "disk");
      setExternalUrl(v.external_url ?? "");
      setDisk(v.disk ?? "");
      setPath(v.path ?? "");
      setOrderNo(v.order_no ?? 0);
      setIsPremium(v.is_premium);
      setIsActive(v.is_active);
    });
  }, [id]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    const formData = new FormData();
    formData.append("_method", "PUT");
    if (categoryId) formData.append("quiz_category_id", categoryId);
    if (stateId) formData.append("state_id", stateId);
    if (vehicleTypeId) formData.append("vehicle_type_id", vehicleTypeId);
    if (testTrack) formData.append("test_track", testTrack);
    if (section) formData.append("section", section);
    if (subsection) formData.append("subsection", subsection);
    formData.append("title", title);
    if (slug) formData.append("slug", slug);
    if (description) formData.append("description", description);
    if (durationSeconds) formData.append("duration_seconds", durationSeconds);
    if (sourceUrl) formData.append("source_url", sourceUrl);
    if (sourceType === "external") {
      formData.append("external_url", externalUrl);
    } else {
      formData.append("disk", disk);
      formData.append("path", path);
    }
    formData.append("order_no", String(orderNo));
    formData.append("is_premium", isPremium ? "1" : "0");
    formData.append("is_active", isActive ? "1" : "0");
    if (thumbnail) formData.append("thumbnail", thumbnail);
    if (removeThumbnail) formData.append("remove_thumbnail", "1");

    try {
      await api.post(`/admin/videos/${id}`, formData);
      router.push("/admin/videos");
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
    } finally {
      setProcessing(false);
    }
  }

  if (!video || !options) {
    return (
      <AdminGuard>
        <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Videos", href: "/admin/videos" }]}>
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
          { title: "Videos", href: "/admin/videos" },
          { title: "Edit", href: "/admin/videos" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">Edit video</h1>
            <p className="text-sm text-muted-foreground">{video.title}</p>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="test_track">Track (optional)</Label>
                <select
                  id="test_track"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={testTrack}
                  onChange={(e) => setTestTrack(e.target.value as "" | "permit_test" | "driving_test")}
                >
                  <option value="">Any track</option>
                  <option value="permit_test">Permit Test</option>
                  <option value="driving_test">Driving Test</option>
                </select>
                <InputError message={errors.test_track?.[0]} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="section">Section (optional)</Label>
                <Input id="section" placeholder="e.g. Parking" value={section} onChange={(e) => setSection(e.target.value)} />
                <InputError message={errors.section?.[0]} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subsection">Subsection (optional)</Label>
                <Input
                  id="subsection"
                  placeholder="e.g. Common Mistakes to Avoid"
                  value={subsection}
                  onChange={(e) => setSubsection(e.target.value)}
                />
                <InputError message={errors.subsection?.[0]} />
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
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" maxLength={5000} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
              <InputError message={errors.description?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="duration_seconds">Duration (seconds, optional)</Label>
              <Input
                id="duration_seconds"
                type="number"
                min={0}
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
              />
              <InputError message={errors.duration_seconds?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="source_url">Source URL (optional)</Label>
              <Input id="source_url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
              <InputError message={errors.source_url?.[0]} />
            </div>

            <div className="space-y-3 rounded-md border border-border p-4">
              <Label className="gap-1">
                Playback source <span className="text-destructive">*</span>
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
                  <Input id="external_url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
                  <InputError message={errors.external_url?.[0]} />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="disk">Disk</Label>
                    <Input id="disk" value={disk} onChange={(e) => setDisk(e.target.value)} />
                    <InputError message={errors.disk?.[0]} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="path">Path</Label>
                    <Input id="path" value={path} onChange={(e) => setPath(e.target.value)} />
                    <InputError message={errors.path?.[0]} />
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="thumbnail">Thumbnail</Label>
              {video.thumbnail_url && !removeThumbnail && !thumbnail && (
                <div className="overflow-hidden rounded-md border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={video.thumbnail_url} alt="" className="h-32 w-auto object-cover" />
                </div>
              )}
              <input
                id="thumbnail"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="text-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setThumbnail(file);
                  if (file) setRemoveThumbnail(false);
                }}
              />
              {video.thumbnail_url && (
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={removeThumbnail}
                    onChange={(e) => {
                      setRemoveThumbnail(e.target.checked);
                      if (e.target.checked) setThumbnail(null);
                    }}
                  />
                  Remove current thumbnail
                </label>
              )}
              <InputError message={errors.thumbnail?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="order_no">Video order</Label>
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

            <div className="flex gap-3">
              <Button type="submit" disabled={processing}>
                Save
              </Button>
              <Button variant="outline" type="button" render={<Link href="/admin/videos" />}>
                Back
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
