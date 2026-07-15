"use client";

import { use, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import PasswordInput from "@/components/ui/PasswordInput";
import Spinner from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      await api.post("/reset-password", {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      router.push("/login");
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors);
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
    <AuthLayout title="Reset password" description="Please enter your new password below">
      <form className="grid gap-6" onSubmit={submit}>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" className="h-11 rounded-xl bg-background" value={email} readOnly />
          <InputError message={errors.email?.[0]} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            autoFocus
            placeholder="Password"
            className="h-11 rounded-xl bg-background focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <InputError message={errors.password?.[0]} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password_confirmation">Confirm password</Label>
          <PasswordInput
            id="password_confirmation"
            autoComplete="new-password"
            placeholder="Confirm password"
            className="h-11 rounded-xl bg-background focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
          />
          <InputError message={errors.password_confirmation?.[0]} />
        </div>

        <Button type="submit" className="mt-4 w-full justify-center" disabled={processing}>
          {processing && <Spinner />}
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}
