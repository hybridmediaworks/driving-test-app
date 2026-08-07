"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type FormEvent } from "react";
import type { VehicleType } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { api, ApiError } from "@/lib/api";

export default function EditVehicleTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.get<{ vehicle_type: VehicleType }>(`/admin/vehicle-types/${id}`).then((res) => {
      setVehicleType(res.vehicle_type);
      setName(res.vehicle_type.name);
      setTitle(res.vehicle_type.title);
      setIsActive(res.vehicle_type.is_active);
    });
  }, [id]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      await api.put(`/admin/vehicle-types/${id}`, { name, title, is_active: isActive });
      router.push("/admin/vehicle-types");
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
    } finally {
      setProcessing(false);
    }
  }

  if (!vehicleType) {
    return (
      <AdminGuard>
        <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Vehicle types", href: "/admin/vehicle-types" }]}>
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
          { title: "Vehicle types", href: "/admin/vehicle-types" },
          { title: "Edit", href: "/admin/vehicle-types" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">Edit vehicle type</h1>
            <p className="text-sm text-muted-foreground">{vehicleType.title}</p>
          </div>

          <form className="w-full max-w-xl space-y-6" onSubmit={submit}>
            <div className="grid gap-2">
              <Label htmlFor="name" className="gap-1">
                Name (slug) <span className="text-destructive">*</span>
              </Label>
              <Input id="name" className="font-mono text-sm" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
              <InputError message={errors.name?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title" className="gap-1">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <InputError message={errors.title?.[0]} />
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
              <Button variant="outline" type="button" render={<Link href="/admin/vehicle-types" />}>
                Back
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
