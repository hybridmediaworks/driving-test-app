"use client";

import { useState, type FormEvent } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import Paragraph from "@/components/ui/Paragraph";
import Spinner from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});
    setStatus(null);

    try {
      const res = await api.post<{ message: string }>("/forgot-password", { email });
      setStatus(res.message);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors);
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
    <AuthLayout title="Forgot password" description="Enter your email to receive a password reset link">
      {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}

      <div className="space-y-6">
        <form className="space-y-6" onSubmit={submit}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="off"
              autoFocus
              placeholder="email@example.com"
              className="h-11 rounded-xl bg-background focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputError message={errors.email?.[0]} />
          </div>

          <Button type="submit" className="w-full justify-center" disabled={processing}>
            {processing && <Spinner />}
            Email password reset link
          </Button>
        </form>

        <Paragraph className="text-center">
          Or, return to{" "}
          <Button variant="ghost" size="md" className="p-0!" href="/login">
            log in
          </Button>
        </Paragraph>
      </div>
    </AuthLayout>
  );
}
