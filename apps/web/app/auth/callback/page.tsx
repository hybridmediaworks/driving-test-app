"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";
import { takeSocialRedirect } from "@/lib/socialAuth";
import { isValidState, stateToSlug } from "@/lib/usStates";


function SocialCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithSocialCode } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const code = searchParams.get("code");
    const redirect = takeSocialRedirect();

    function fail(error: string) {
      const query = new URLSearchParams({ social_error: error });
      if (redirect) query.set("redirect", redirect);
      router.replace(`/login?${query}`);
    }

    if (!code) {
      fail(searchParams.get("error") ?? "failed");
      return;
    }

    loginWithSocialCode(code)
      .then((user) => {
        if (redirect) {
          router.replace(redirect);
          return;
        }
        if (!user.email_verified_at) {
          router.replace("/verify-email");
          return;
        }
        const storedState = localStorage.getItem("selectedState");
        router.replace(storedState && isValidState(storedState) ? `/${stateToSlug(storedState)}` : "/dashboard");
      })
      .catch(() => fail("failed"));
  }, [searchParams, router, loginWithSocialCode]);

  return (
    <AuthLayout title="Signing you in…">
      <div className="flex justify-center">
        <Spinner className="size-6 text-blue-600" />
      </div>
    </AuthLayout>
  );
}

export default function SocialCallbackPage() {
  return (
    <Suspense>
      <SocialCallbackInner />
    </Suspense>
  );
}
