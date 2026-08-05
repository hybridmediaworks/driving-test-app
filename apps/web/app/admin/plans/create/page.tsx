"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { BillingInterval, PlanType } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { api, ApiError } from "@/lib/api";

export default function CreatePlanPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<PlanType>("recurring");
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("month");
  const [price, setPrice] = useState("0");
  const [maxSeats, setMaxSeats] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      await api.post("/admin/plans", {
        key,
        name,
        type,
        billing_interval: type === "one_time" ? null : billingInterval,
        price_cents: Math.round(Number(price) * 100),
        max_seats: maxSeats,
        is_active: isActive,
        sort_order: sortOrder,
      });
      router.push("/admin/plans");
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
          { title: "Plans", href: "/admin/plans" },
          { title: "New", href: "/admin/plans/create" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">New plan</h1>
            <p className="text-sm text-muted-foreground">
              Real Stripe price/product are created afterward by <code className="text-xs">php artisan billing:sync-plans</code>, not here.
            </p>
          </div>

          <form className="w-full max-w-xl space-y-6" onSubmit={submit}>
            <div className="grid gap-2">
              <Label htmlFor="key" className="gap-1">
                Key <span className="text-destructive">*</span>
              </Label>
              <Input
                id="key"
                className="font-mono text-sm"
                placeholder="lifetime_family"
                autoComplete="off"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Lowercase with underscores, e.g. <code>weekly</code>, <code>lifetime_family</code>
              </p>
              <InputError message={errors.key?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name" className="gap-1">
                Display name <span className="text-destructive">*</span>
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              <InputError message={errors.name?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Billing type</Label>
              <select
                id="type"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as PlanType)}
              >
                <option value="recurring">Recurring subscription</option>
                <option value="one_time">One-time purchase</option>
              </select>
              <InputError message={errors.type?.[0]} />
            </div>

            {type === "recurring" && (
              <div className="grid gap-2">
                <Label htmlFor="billing_interval">Billing interval</Label>
                <select
                  id="billing_interval"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={billingInterval}
                  onChange={(e) => setBillingInterval(e.target.value as BillingInterval)}
                >
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
                <InputError message={errors.billing_interval?.[0]} />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="price" className="gap-1">
                Price (USD) <span className="text-destructive">*</span>
              </Label>
              <Input id="price" type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
              <InputError message={errors.price_cents?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="max_seats" className="gap-1">
                Max seats <span className="text-destructive">*</span>
              </Label>
              <Input
                id="max_seats"
                type="number"
                min={1}
                max={100}
                value={maxSeats}
                onChange={(e) => setMaxSeats(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">1 for individual plans, 3 for Lifetime Family.</p>
              <InputError message={errors.max_seats?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sort_order">Sort order</Label>
              <Input id="sort_order" type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
              <InputError message={errors.sort_order?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="is_active">Status</Label>
              <select
                id="is_active"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={isActive ? "true" : "false"}
                onChange={(e) => setIsActive(e.target.value === "true")}
              >
                <option value="true">Active (shown on /pricing)</option>
                <option value="false">Inactive</option>
              </select>
              <InputError message={errors.is_active?.[0]} />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={processing}>
                Create
              </Button>
              <Button variant="outline" type="button" render={<Link href="/admin/plans" />}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
