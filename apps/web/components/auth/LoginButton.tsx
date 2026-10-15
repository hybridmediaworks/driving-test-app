"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Button from "@/components/ui/Button";
import { loginHref } from "@/lib/redirect";

function LoginButtonWithReturn({ className }: { className: string }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  return (
    <Button className={className} variant="ghost" href={loginHref(search ? `${pathname}?${search}` : pathname)}>
      Login
    </Button>
  );
}

export default function LoginButton({ className }: { className: string }) {
  return (
    <Suspense
      fallback={
        <Button className={className} variant="ghost" href="/login">
          Login
        </Button>
      }
    >
      <LoginButtonWithReturn className={className} />
    </Suspense>
  );
}
