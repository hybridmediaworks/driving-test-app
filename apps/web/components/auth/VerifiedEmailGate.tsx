"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";
import { isAllowedUnverified } from "@/lib/emailVerificationGate";

export default function VerifiedEmailGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const blocked = !loading && user !== null && !user.email_verified_at && !isAllowedUnverified(pathname);

  useEffect(() => {
    if (blocked) router.replace("/verify-email");
  }, [blocked, router]);

  if (blocked) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Spinner className="size-6 text-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}
