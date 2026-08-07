"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import Paragraph from "@/components/ui/Paragraph";
import PasswordInput from "@/components/ui/PasswordInput";
import Spinner from "@/components/ui/Spinner";
import { ApiError, useAuth } from "@/lib/auth-context";

function RegisterPageInner() {
  const router = useRouter();
  const { register } = useAuth();
  const searchParams = useSearchParams();
  // Same purpose as the login page's redirect param — e.g. resuming a checkout the user
  // started before we sent them here to create an account. Registration doesn't require a
  // verified email to check out (no verification middleware on the billing routes), so it's
  // safe to go straight there instead of the default /verify-email reminder.
  const redirect = searchParams.get("redirect");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      await register(name, email, password, passwordConfirmation);
      router.push(redirect || "/verify-email");
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors);
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
    <AuthLayout title="Create an account" description="Enter your details below to create your account">
      <form className="flex flex-col gap-6" onSubmit={submit}>
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              required
              autoFocus
              tabIndex={1}
              autoComplete="name"
              placeholder="Full name"
              className="h-11 rounded-xl bg-background focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
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
              required
              tabIndex={2}
              autoComplete="email"
              placeholder="email@example.com"
              className="h-11 rounded-xl bg-background focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputError message={errors.email?.[0]} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              required
              tabIndex={3}
              autoComplete="new-password"
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
              required
              tabIndex={4}
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
            Create account
          </Button>
        </div>

        <Paragraph className="text-center">
          Already have an account?{" "}
          <Button
            variant="ghost"
            size="md"
            className="p-0!"
            href={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"}
          >
            Log in
          </Button>
        </Paragraph>
      </form>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterPageInner />
    </Suspense>
  );
}
