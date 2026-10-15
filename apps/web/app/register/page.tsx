"use client";

import { LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import {
  AuthField,
  AuthFooter,
  AuthInput,
  authLinkClass,
  AuthPasswordInput,
  AuthSubmitButton,
  SocialSignIn,
} from "@/components/auth/AuthFormParts";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { ApiError, useAuth } from "@/lib/auth-context";

function RegisterPageInner() {
  const router = useRouter();
  const { register } = useAuth();
  const searchParams = useSearchParams();
  // Only forwarded to the login link and social sign-in. A new account must verify its email
  // before anything else, so a pending checkout resumes from the verification link instead.
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
      router.push("/verify-email");
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors);
      }
    } finally {
      setProcessing(false);
    }
  }

  const loginHref = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login";

  return (
    <AuthSplitLayout
      title="Create an account"
      headline={["Let’s get you", "ready for the"]}
      highlight="road."
    >
      <form className="mt-3 sm:mt-7 xl:mt-10" onSubmit={submit}>
        <AuthField
          id="name"
          label="Name"
          icon={UserRound}
          error={errors.name?.[0]}
          className="gap-1 sm:gap-2"
        >
          <AuthInput
            id="name"
            type="text"
            required
            autoFocus
            autoComplete="name"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </AuthField>

        <AuthField
          id="email"
          label="Email address"
          icon={Mail}
          error={errors.email?.[0]}
          className="mt-2.5 gap-1 sm:mt-5 sm:gap-2"
        >
          <AuthInput
            id="email"
            type="email"
            required
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
          className="mt-2.5 gap-1 sm:mt-5 sm:gap-2"
        >
          <AuthPasswordInput
            id="password"
            required
            autoComplete="new-password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </AuthField>

        <AuthField
          id="password_confirmation"
          label="Confirm password"
          icon={LockKeyhole}
          error={errors.password_confirmation?.[0]}
          className="mt-2.5 gap-1 sm:mt-5 sm:gap-2"
        >
          <AuthPasswordInput
            id="password_confirmation"
            required
            autoComplete="new-password"
            placeholder="Confirm your password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
          />
        </AuthField>

        <AuthSubmitButton processing={processing}>Create account</AuthSubmitButton>
      </form>

      <SocialSignIn redirect={redirect} />

      <AuthFooter>
        Already have an account?{" "}
        <Link href={loginHref} className={authLinkClass}>
          Log in
        </Link>
      </AuthFooter>
    </AuthSplitLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterPageInner />
    </Suspense>
  );
}
