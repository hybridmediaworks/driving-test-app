"use client";

import { useState, type FormEvent } from "react";
import DeleteUser from "@/components/settings/DeleteUser";
import HeadingSmall from "@/components/settings/HeadingSmall";
import SettingsLayout from "@/components/settings/SettingsLayout";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [resendSent, setResendSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      const res = await api.patch<{ user: typeof user }>("/profile", { name, email });
      if (res.user) setUser(res.user);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors);
      }
    } finally {
      setProcessing(false);
    }
  }

  async function resendVerification() {
    await api.post("/email/verification-notification");
    setResendSent(true);
  }

  if (!user) return null;

  return (
    <SettingsLayout>
      <div className="flex flex-col space-y-6">
        <HeadingSmall title="Profile information" description="Update your name and email address" />

        <form className="space-y-6" onSubmit={submit}>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              className="mt-1 block w-full"
              required
              autoComplete="name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <InputError message={errors.name?.[0]} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              className="mt-1 block w-full"
              required
              autoComplete="username"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputError message={errors.email?.[0]} />
          </div>

          {!user.email_verified_at && (
            <div>
              <p className="-mt-4 text-sm text-muted-foreground">
                Your email address is unverified.{" "}
                <button
                  type="button"
                  onClick={resendVerification}
                  className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current!"
                >
                  Click here to resend the verification email.
                </button>
              </p>

              {resendSent && (
                <div className="mt-2 text-sm font-medium text-green-600">
                  A new verification link has been sent to your email address.
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={processing}>
              Save
            </Button>
          </div>
        </form>
      </div>

      <DeleteUser />
    </SettingsLayout>
  );
}
