"use client";

import { LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import {
  AuthField,
  AuthFooter,
  AuthInput,
  authLabelClass,
  authLinkClass,
  AuthPasswordInput,
  AuthSubmitButton,
  SocialSignIn,
} from "@/components/auth/AuthFormParts";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { Checkbox } from "@/components/ui/Checkbox";
import { Label } from "@/components/ui/Label";
import { ApiError, useAuth } from "@/lib/auth-context";
import { socialErrorMessage } from "@/lib/socialAuth";
import { isValidState, stateToSlug } from "@/lib/usStates";

function LoginPageInner() {
  const router = useRouter();
  const { login } = useAuth();
  const searchParams = useSearchParams();
  // Where to land after a successful login — e.g. back at /pricing to resume a checkout the
  // user started before we sent them here to authenticate. Falls back to the dashboard.
  const redirect = searchParams.get("redirect");

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
      if (redirect) {
        router.push(redirect);
        return;
      }
      const storedState = localStorage.getItem("selectedState");
      router.push(
        storedState && isValidState(storedState)
          ? `/${stateToSlug(storedState)}`
          : "/dashboard",
      );
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors);
      }
    } finally {
      setProcessing(false);
    }
  }

  const registerHref = redirect
    ? `/register?redirect=${encodeURIComponent(redirect)}`
    : "/register";

  return (
    <AuthSplitLayout
      title="Welcome back!"
      headline={["Let’s get you", "back on the"]}
      highlight="road."
    >
      <form className="mt-4 sm:mt-7 xl:mt-10" onSubmit={submit}>
        <AuthField id="email" label="Email address" icon={Mail} error={errors.email?.[0]}>
          <AuthInput
            id="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </AuthField>

        <AuthField
          id="password"
          label="Password"
          icon={LockKeyhole}
          error={errors.password?.[0]}
          className="mt-3 sm:mt-5"
          action={
            <Link
              href="/forgot-password"
              className="text-[13px] font-medium text-blue-600 sm:text-sm hover:text-blue-700 hover:underline xl:text-base dark:text-blue-400"
            >
              Forgot password?
            </Link>
          }
        >
          <AuthPasswordInput
            id="password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </AuthField>

        <Label htmlFor="remember" className={`mt-3 w-fit cursor-pointer gap-2.5 sm:mt-5 sm:gap-3 ${authLabelClass}`}>
          <Checkbox
            id="remember"
            checked={remember}
            onCheckedChange={setRemember}
            className="size-4.5 rounded-md sm:size-5 border-neutral-300 bg-white focus-visible:border-blue-500 focus-visible:ring-blue-500/30 data-checked:border-blue-600 data-checked:bg-blue-600 data-checked:text-white dark:border-neutral-600 dark:bg-neutral-800 dark:data-checked:bg-blue-600 [&_svg]:size-3.5! [&_svg]:stroke-3"
          />
          Remember me
        </Label>

        <AuthSubmitButton processing={processing}>Log in</AuthSubmitButton>
      </form>

      <SocialSignIn redirect={redirect} error={socialErrorMessage(searchParams.get("social_error"))} />

      <AuthFooter>
        Don&apos;t have an account?{" "}
        <Link href={registerHref} className={authLinkClass}>
          Create an account
        </Link>
      </AuthFooter>
    </AuthSplitLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
