"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type FormEvent } from "react";
import type { State } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { api, ApiError } from "@/lib/api";

type PermitFactKey =
  | "permit_test_fee_cents"
  | "retake_wait_days"
  | "supervised_driving_hours"
  | "minimum_permit_age"
  | "test_language_count";

const PERMIT_FACT_FIELDS: { key: PermitFactKey; label: string; placeholder: string; step?: string; min?: number }[] = [
  { key: "permit_test_fee_cents", label: "Test fee (USD)", placeholder: "15.00", step: "0.01", min: 0 },
  { key: "retake_wait_days", label: "Retake wait (days)", placeholder: "7", min: 0 },
  { key: "supervised_driving_hours", label: "Supervised driving hours", placeholder: "40", min: 0 },
  { key: "minimum_permit_age", label: "Minimum permit age (years)", placeholder: "14", min: 13 },
  { key: "test_language_count", label: "Test languages", placeholder: "2", min: 1 },
];

export default function EditStatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [state, setState] = useState<State | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [dmvWebsiteUrl, setDmvWebsiteUrl] = useState("");
  // Permit-test facts behind the "at a glance" grid on /{state}/{test-slug}. Kept as strings so a
  // blank field round-trips as null rather than 0.
  const [facts, setFacts] = useState<Record<PermitFactKey, string>>({
    permit_test_fee_cents: "",
    retake_wait_days: "",
    supervised_driving_hours: "",
    minimum_permit_age: "",
    test_language_count: "",
  });
  const [onlineTesting, setOnlineTesting] = useState<"" | "yes" | "no">("");
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.get<{ state: State }>(`/admin/states/${id}`).then((res) => {
      setState(res.state);
      setCode(res.state.code);
      setName(res.state.name);
      setAgencyName(res.state.agency_name ?? "");
      setDmvWebsiteUrl(res.state.dmv_website_url ?? "");
      setFacts({
        permit_test_fee_cents: res.state.permit_test_fee_cents == null ? "" : String(res.state.permit_test_fee_cents / 100),
        retake_wait_days: res.state.retake_wait_days?.toString() ?? "",
        supervised_driving_hours: res.state.supervised_driving_hours?.toString() ?? "",
        minimum_permit_age: res.state.minimum_permit_age?.toString() ?? "",
        test_language_count: res.state.test_language_count?.toString() ?? "",
      });
      setOnlineTesting(res.state.online_testing_available == null ? "" : res.state.online_testing_available ? "yes" : "no");
    });
  }, [id]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      await api.put(`/admin/states/${id}`, {
        code: code.toUpperCase(),
        name,
        agency_name: agencyName || null,
        dmv_website_url: dmvWebsiteUrl || null,
        // The fee is entered in dollars and stored in cents.
        permit_test_fee_cents: facts.permit_test_fee_cents === "" ? null : Math.round(Number(facts.permit_test_fee_cents) * 100),
        retake_wait_days: facts.retake_wait_days === "" ? null : Number(facts.retake_wait_days),
        supervised_driving_hours: facts.supervised_driving_hours === "" ? null : Number(facts.supervised_driving_hours),
        minimum_permit_age: facts.minimum_permit_age === "" ? null : Number(facts.minimum_permit_age),
        test_language_count: facts.test_language_count === "" ? null : Number(facts.test_language_count),
        online_testing_available: onlineTesting === "" ? null : onlineTesting === "yes",
      });
      router.push("/admin/states");
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
    } finally {
      setProcessing(false);
    }
  }

  if (!state) {
    return (
      <AdminGuard>
        <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "States", href: "/admin/states" }]}>
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
          { title: "States", href: "/admin/states" },
          { title: "Edit", href: "/admin/states" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">Edit state</h1>
            <p className="text-sm text-muted-foreground">{state.name}</p>
          </div>

          <form className="w-full max-w-xl space-y-6" onSubmit={submit}>
            <div className="grid gap-2">
              <Label htmlFor="code" className="gap-1">
                Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                className="font-mono text-sm uppercase"
                maxLength={2}
                autoComplete="off"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <InputError message={errors.code?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name" className="gap-1">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              <InputError message={errors.name?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="agency_name">Agency name</Label>
              <Input
                id="agency_name"
                placeholder="DMV (leave blank to default to “DMV”)"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
              />
              <InputError message={errors.agency_name?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dmv_website_url">DMV website URL</Label>
              <Input
                id="dmv_website_url"
                placeholder="https://..."
                value={dmvWebsiteUrl}
                onChange={(e) => setDmvWebsiteUrl(e.target.value)}
              />
              <InputError message={errors.dmv_website_url?.[0]} />
            </div>

            <div className="grid gap-2 pt-2">
              <p className="text-sm font-medium">Permit test facts</p>
              <p className="text-sm text-muted-foreground">
                Published state requirements shown in the “at a glance” grid on the test page. Leave a field blank and
                that fact is left out of the grid rather than guessed.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {PERMIT_FACT_FIELDS.map((field) => (
                <div key={field.key} className="grid gap-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    type="number"
                    inputMode="decimal"
                    step={field.step}
                    min={field.min}
                    placeholder={field.placeholder}
                    value={facts[field.key]}
                    onChange={(e) => setFacts((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  />
                  <InputError message={errors[field.key]?.[0]} />
                </div>
              ))}

              <div className="grid gap-2">
                <Label htmlFor="online_testing_available">Online testing available</Label>
                <select
                  id="online_testing_available"
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                  value={onlineTesting}
                  onChange={(e) => setOnlineTesting(e.target.value as "" | "yes" | "no")}
                >
                  <option value="">Not published</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                <InputError message={errors.online_testing_available?.[0]} />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={processing}>
                Save
              </Button>
              <Button variant="outline" type="button" render={<Link href="/admin/states" />}>
                Back
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
