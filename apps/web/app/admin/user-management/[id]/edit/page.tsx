"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type FormEvent } from "react";
import type { User } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/ShadcnButton";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user: me } = useAuth();

  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.get<{ user: User }>(`/admin/users/${id}`).then((res) => {
      setTargetUser(res.user);
      setName(res.user.name);
      setEmail(res.user.email);
      setIsAdmin(res.user.is_admin);
    });
  }, [id]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      await api.put(`/admin/users/${id}`, {
        name,
        email,
        password: password || undefined,
        password_confirmation: password ? passwordConfirmation : undefined,
        is_admin: isAdmin,
      });
      router.push("/admin/user-management");
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
    } finally {
      setProcessing(false);
    }
  }

  if (!targetUser) {
    return (
      <AdminGuard>
        <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "User Management", href: "/admin/user-management" }]}>
          <div className="app-page text-sm text-muted-foreground">Loading…</div>
        </AppLayout>
      </AdminGuard>
    );
  }

  const isSelf = me?.id === targetUser.id;

  return (
    <AdminGuard>
      <AppLayout
        breadcrumbs={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "User Management", href: "/admin/user-management" },
          { title: "Edit", href: "/admin/user-management" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">Edit user</h1>
            <p className="text-sm text-muted-foreground">{targetUser.name}</p>
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
              <p className="text-xs text-muted-foreground">Changing the email un-verifies the account.</p>
              <InputError message={errors.email?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">New password (optional)</Label>
              <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <p className="text-xs text-muted-foreground">Leave blank to keep the current password.</p>
              <InputError message={errors.password?.[0]} />
            </div>

            {password && (
              <div className="grid gap-2">
                <Label htmlFor="password_confirmation">Confirm new password</Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  autoComplete="new-password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                />
                <InputError message={errors.password_confirmation?.[0]} />
              </div>
            )}

            <Label htmlFor="is_admin" className="flex items-center space-x-3">
              <Checkbox id="is_admin" checked={isAdmin} onCheckedChange={setIsAdmin} disabled={isSelf} />
              <span>Admin access</span>
            </Label>
            {isSelf && <p className="text-xs text-muted-foreground">You can&apos;t revoke your own admin access.</p>}
            <InputError message={errors.is_admin?.[0]} />

            <div className="flex gap-3">
              <Button type="submit" disabled={processing}>
                Save
              </Button>
              <Button variant="outline" type="button" render={<Link href="/admin/user-management" />}>
                Back
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}
