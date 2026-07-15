"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/ui/Button";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import PasswordInput from "@/components/ui/PasswordInput";
import Spinner from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";

export default function ConfirmPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      await api.post("/confirm-password", { password });
      router.back();
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors);
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
    <AuthLayout
      title="Confirm your password"
      description="This is a secure area of the application. Please confirm your password before continuing."
    >
      <form className="space-y-6" onSubmit={submit}>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            required
            autoComplete="current-password"
            autoFocus
            className="h-11 rounded-xl bg-background focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <InputError message={errors.password?.[0]} />
        </div>

        <Button type="submit" className="w-full justify-center" disabled={processing}>
          {processing && <Spinner />}
          Confirm password
        </Button>
      </form>
    </AuthLayout>
  );
}
