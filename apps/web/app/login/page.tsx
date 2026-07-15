"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import Paragraph from "@/components/ui/Paragraph";
import PasswordInput from "@/components/ui/PasswordInput";
import Spinner from "@/components/ui/Spinner";
import { ApiError, useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors);
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
    <AuthLayout title="Log in to your account" description="Enter your email and password below to log in">
      <form className="flex flex-col gap-6" onSubmit={submit}>
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              autoFocus
              tabIndex={1}
              autoComplete="email"
              placeholder="email@example.com"
              className="h-11 rounded-xl bg-background focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputError message={errors.email?.[0]} />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Button variant="ghost" size="sm" className="p-0!" href="/forgot-password">
                Forgot password?
              </Button>
            </div>
            <PasswordInput
              id="password"
              required
              tabIndex={2}
              autoComplete="current-password"
              placeholder="Password"
              className="h-11 rounded-xl bg-background focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <InputError message={errors.password?.[0]} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="remember" className="flex items-center space-x-3">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={setRemember}
                className="bg-background focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
              />
              <span>Remember me</span>
            </Label>
          </div>

          <Button type="submit" className="mt-4 w-full justify-center" disabled={processing}>
            {processing && <Spinner />}
            Log in
          </Button>
        </div>

        <Paragraph className="text-center">
          Don&apos;t have an account?{" "}
          <Button variant="ghost" size="md" className="p-0!" href="/register">
            Sign Up
          </Button>
        </Paragraph>
      </form>
    </AuthLayout>
  );
}
