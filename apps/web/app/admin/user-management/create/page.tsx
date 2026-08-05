"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { api, ApiError } from "@/lib/api";

export default function CreateUserPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      await api.post("/admin/users", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        is_admin: isAdmin,
      });
      router.push("/admin/user-management");
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
          { title: "User Management", href: "/admin/user-management" },
          { title: "New", href: "/admin/user-management/create" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">New user</h1>
            <p className="text-sm text-muted-foreground">Admin-created accounts are marked verified immediately.</p>
          </div>

          <form className="w-full max-w-xl space-y-6" onSubmit={submit}>
            <div className="grid gap-2">
              <Label htmlFor="name" className="gap-1">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              <InputError message={errors.name?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="gap-1">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
              <InputError message={errors.email?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password" className="gap-1">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <InputError message={errors.password?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password_confirmation" className="gap-1">
                Confirm password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password_confirmation"
                type="password"
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
              />
              <InputError message={errors.password_confirmation?.[0]} />
            </div>

            <Label htmlFor="is_admin" className="flex items-center space-x-3">
              <Checkbox id="is_admin" checked={isAdmin} onCheckedChange={setIsAdmin} />
              <span>Admin access</span>
            </Label>
            <InputError message={errors.is_admin?.[0]} />

            <div className="flex gap-3">
              <Button type="submit" disabled={processing}>
                Create
              </Button>
              <Button variant="outline" type="button" render={<Link href="/admin/user-management" />}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
