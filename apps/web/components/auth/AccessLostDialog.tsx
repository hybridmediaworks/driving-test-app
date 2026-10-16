"use client";

import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuth, useEntitlement } from "@/lib/auth-context";
import { pricingHref } from "@/lib/pricing";

export function usePremiumAccessLost(isPremiumContent: boolean, vehicle?: string | null): boolean {
  const { loading, isPremiumFor } = useEntitlement();
  return isPremiumContent && !loading && !isPremiumFor(vehicle);
}

export default function AccessLostDialog({
  open,
  exitHref,
  vehicle,
}: {
  open: boolean;
  exitHref: string;
  vehicle?: string | null;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const signedOut = user === null;

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} className="max-w-md! gap-0 rounded-3xl p-8 text-center">
        <DialogTitle className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {signedOut ? "You've been signed out" : "Premium access needed"}
        </DialogTitle>
        <DialogDescription className="mt-3 text-base">
          {signedOut
            ? "This test is paused and your progress is saved. Sign in again to pick up right where you left off."
            : "This test is part of Premium. It's paused and your progress is saved, so you can continue once your account has Premium access."}
        </DialogDescription>

        <div className="mt-6 flex flex-col gap-3">
          {signedOut ? (
            <Button href={`/login?redirect=${encodeURIComponent(pathname)}`} className="w-full">
              Sign in to continue
            </Button>
          ) : (
            <Button href={pricingHref(vehicle)} className="w-full">
              See plans
            </Button>
          )}
          <Button href={exitHref} variant="ghost" className="w-full">
            Leave test
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
