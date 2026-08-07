"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { api, ApiError } from "@/lib/api";

export default function CreateStatePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [dmvWebsiteUrl, setDmvWebsiteUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      await api.post("/admin/states", {
        code: code.toUpperCase(),
        name,
        agency_name: agencyName || null,
        dmv_website_url: dmvWebsiteUrl || null,
      });
      router.push("/admin/states");
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
          { title: "States", href: "/admin/states" },
          { title: "New", href: "/admin/states/create" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">New state</h1>
            <p className="text-sm text-muted-foreground">Two-letter code and full name.</p>
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
                placeholder="CA"
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
              <Input id="name" placeholder="California" value={name} onChange={(e) => setName(e.target.value)} />
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

            <div className="flex gap-3">
              <Button type="submit" disabled={processing}>
                Create
              </Button>
              <Button variant="outline" type="button" render={<Link href="/admin/states" />}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
