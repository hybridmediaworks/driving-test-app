"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type FormEvent } from "react";
import type { AdminPlan, BillingInterval, PlanType } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { api, ApiError } from "@/lib/api";

export default function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [plan, setPlan] = useState<AdminPlan | null>(null);
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<PlanType>("recurring");
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("month");
  const [price, setPrice] = useState("0");
  const [trialDays, setTrialDays] = useState("");
  const [maxSeats, setMaxSeats] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.get<{ plan: AdminPlan }>(`/admin/plans/${id}`).then((res) => {
      setPlan(res.plan);
      setKey(res.plan.key);
      setName(res.plan.name);
      setType(res.plan.type);
      setBillingInterval(res.plan.billing_interval ?? "month");
      setPrice((res.plan.price_cents / 100).toString());
      setTrialDays(res.plan.trial_days === null ? "" : String(res.plan.trial_days));
      setMaxSeats(res.plan.max_seats);
      setIsActive(res.plan.is_active);
      setSortOrder(res.plan.sort_order);
    });
  }, [id]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      await api.put(`/admin/plans/${id}`, {
        key,
        name,
        type,
        billing_interval: type === "one_time" ? null : billingInterval,
        price_cents: Math.round(Number(price) * 100),
        trial_days: trialDays === "" ? null : Number(trialDays),
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

  if (!plan) {
    return (
      <AdminGuard>
        <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Plans", href: "/admin/plans" }]}>
          <div className="app-page text-sm text-muted-foreground">Loading…</div>
        </AppLayout>
      </AdminGuard>
    );
  }

  // Stripe Prices are immutable — once real money can flow through this plan, the fields that
  // determine what Stripe actually charges can't be edited here (the backend rejects it too;
  // this just avoids a round-trip to find that out). Create a new plan instead.
  const isSynced = plan.stripe_price_id !== null;

  return (
    <AdminGuard>
      <AppLayout
        breadcrumbs={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Plans", href: "/admin/plans" },
          { title: "Edit", href: "/admin/plans" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">Edit plan</h1>
            <p className="text-sm text-muted-foreground">{plan.name}</p>
          </div>

          <div className="w-full max-w-xl rounded-md border bg-muted/40 p-4 text-sm">
            <p className="font-medium">Stripe linkage (read-only)</p>
            <p className="text-muted-foreground">
              Price ID: <code className="text-xs">{plan.stripe_price_id ?? "not synced yet"}</code>
            </p>
            <p className="text-muted-foreground">
              Product ID: <code className="text-xs">{plan.stripe_product_id ?? "not synced yet"}</code>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isSynced
                ? "Billing type, interval, and price are locked below — Stripe Prices are immutable, so editing them here couldn't change what's actually charged. To change the price, create a new plan and deactivate this one."
                : "Not yet synced — billing type, interval, and price are still editable. Run php artisan billing:sync-plans once you're ready to create the real Stripe Price; those fields lock automatically after that."}
            </p>
          </div>

          <form className="w-full max-w-xl space-y-6" onSubmit={submit}>
            <div className="grid gap-2">
              <Label htmlFor="key" className="gap-1">
                Key <span className="text-destructive">*</span>
              </Label>
              <Input id="key" className="font-mono text-sm" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} />
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
                className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                value={type}
                disabled={isSynced}
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
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  value={billingInterval}
                  disabled={isSynced}
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
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                value={price}
                disabled={isSynced}
                onChange={(e) => setPrice(e.target.value)}
              />
              <InputError message={errors.price_cents?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="trial_days">Free trial (days)</Label>
              <Input
                id="trial_days"
                type="number"
                min={1}
                max={90}
                placeholder="No trial"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank for no trial. Card is required at checkout either way — this delays the first charge.
              </p>
              <InputError message={errors.trial_days?.[0]} />
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
                Save
              </Button>
              <Button variant="outline" type="button" render={<Link href="/admin/plans" />}>
                Back
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
