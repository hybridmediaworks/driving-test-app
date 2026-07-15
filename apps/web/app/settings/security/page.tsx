"use client";

import { useState, type FormEvent } from "react";
import HeadingSmall from "@/components/settings/HeadingSmall";
import SettingsLayout from "@/components/settings/SettingsLayout";
import Button from "@/components/ui/Button";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import PasswordInput from "@/components/ui/PasswordInput";
import { api, ApiError } from "@/lib/api";

export default function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      await api.put("/password", {
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      });
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirmation("");
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors);
      }
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirmation("");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <HeadingSmall
          title="Update password"
          description="Ensure your account is using a long, random password to stay secure"
        />

        <form className="space-y-6" onSubmit={submit}>
          <div className="grid gap-2">
            <Label htmlFor="current_password">Current password</Label>
            <PasswordInput
              id="current_password"
              className="mt-1 block w-full"
              autoComplete="current-password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <InputError message={errors.current_password?.[0]} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">New password</Label>
            <PasswordInput
              id="password"
              className="mt-1 block w-full"
              autoComplete="new-password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <InputError message={errors.password?.[0]} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password_confirmation">Confirm password</Label>
            <PasswordInput
              id="password_confirmation"
              className="mt-1 block w-full"
              autoComplete="new-password"
              placeholder="Confirm password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
            />
            <InputError message={errors.password_confirmation?.[0]} />
          </div>

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={processing}>
              Save password
            </Button>
          </div>
        </form>
      </div>
    </SettingsLayout>
  );
}
