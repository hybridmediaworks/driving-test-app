"use client";

import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuth, useEntitlement } from "@/lib/auth-context";

export function usePremiumAccessLost(isPremiumContent: boolean): boolean {
  const { loading, isPremium } = useEntitlement();
  return isPremiumContent && !loading && !isPremium;
}

export default function AccessLostDialog({ open, exitHref }: { open: boolean; exitHref: string }) {
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
            <Button href="/pricing" className="w-full">
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
