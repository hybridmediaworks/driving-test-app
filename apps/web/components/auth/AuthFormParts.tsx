"use client";

import type { SocialProvider } from "@driving-test-app/shared";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ComponentProps, type ComponentType, type ReactNode, type SVGProps } from "react";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import PasswordInput from "@/components/ui/PasswordInput";
import { FacebookLogo, Google } from "@/components/ui/SocialIcons";
import Spinner from "@/components/ui/Spinner";
import { startSocialLogin } from "@/lib/socialAuth";
import { cn } from "@/lib/utils";

export const authLabelClass = "text-[13px] font-medium sm:text-sm text-neutral-800 xl:text-base dark:text-neutral-200";

export const authLinkClass =
  "font-semibold text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400";

const inputClass =
  "h-10 rounded-xl border-neutral-200 bg-white pl-9 text-base! text-neutral-900 placeholder:text-neutral-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/30 sm:h-12 sm:pl-12 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500";

const SOCIAL_PROVIDERS: {
  id: SocialProvider;
  name: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  enabled: boolean;
}[] = [
  { id: "google", name: "Google", Icon: Google, enabled: true },
  { id: "facebook", name: "Facebook", Icon: FacebookLogo, enabled: false },
];

const ENABLED_SOCIAL_PROVIDERS = SOCIAL_PROVIDERS.filter((provider) => provider.enabled);

export function AuthField({
  id,
  label,
  icon: Icon,
  error,
  action,
  className,
  children,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5 sm:gap-2", className)}>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={id} className={authLabelClass}>
          {label}
        </Label>
        {action}
      </div>
      <div className="relative">
        <Icon
          aria-hidden="true"
          strokeWidth={1.75}
          className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-neutral-500 sm:left-4 sm:size-5 dark:text-neutral-400"
        />
        {children}
      </div>
      <InputError message={error} />
    </div>
  );
}

export function AuthInput({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input className={cn(inputClass, className)} {...props} />;
}

export function AuthPasswordInput({ className, ...props }: ComponentProps<typeof PasswordInput>) {
  return (
    <PasswordInput
      className={cn(inputClass, "pr-11! sm:pr-14!", className)}
      toggleClassName="px-3 text-neutral-600 sm:px-4 dark:text-neutral-300"
      iconClassName="size-4 sm:size-5"
      {...props}
    />
  );
}

export function AuthSubmitButton({ processing, children }: { processing: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={processing}
      className="mt-5 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-r from-[#4a7cf3] to-[#1f4fe0] text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.7)] transition hover:brightness-110 focus-visible:ring-4 focus-visible:ring-blue-500/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70 sm:mt-6 sm:h-12 sm:text-base xl:mt-7 xl:gap-2.5"
    >
      {processing && <Spinner />}
      {children}
      <ArrowRight aria-hidden="true" strokeWidth={2.25} className="size-4 sm:size-5" />
    </button>
  );
}

/**
 * Google / Facebook buttons. Each one leaves the page for the provider's sign-in and comes
 * back through /auth/callback, which then continues to `redirect` (when given).
 */
export function SocialSignIn({ redirect = null, error }: { redirect?: string | null; error?: string | null }) {
  const [pending, setPending] = useState<SocialProvider | null>(null);

  // Coming back with the browser's Back button restores this page from the bfcache with the
  // spinner still showing — clear it so the buttons work again.
  useEffect(() => {
    const reset = (e: PageTransitionEvent) => {
      if (e.persisted) setPending(null);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  function start(provider: SocialProvider) {
    setPending(provider);
    startSocialLogin(provider, redirect);
  }

  return (
    <>
      <div className="mt-4 flex items-center gap-4 sm:mt-6 xl:mt-7">
        <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
        <span className="shrink-0 text-xs text-neutral-500 sm:text-sm dark:text-neutral-400">
          or continue with
        </span>
        <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
      </div>
      {error && (
        <p role="alert" className="mt-3 text-center text-sm text-red-600 sm:mt-5 dark:text-red-400">
          {error}
        </p>
      )}
      <div
        className={`mt-3 grid gap-2 sm:mt-5 sm:gap-3 xl:gap-4 ${ENABLED_SOCIAL_PROVIDERS.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {ENABLED_SOCIAL_PROVIDERS.map(({ id, name, Icon }) => (
          <button
            key={id}
            type="button"
            disabled={pending !== null}
            onClick={() => start(id)}
            aria-label={`Continue with ${name}`}
            className="flex h-10 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-1 text-xs font-medium text-neutral-900 transition hover:bg-neutral-50 focus-visible:ring-4 focus-visible:ring-blue-500/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70 sm:h-12 sm:gap-2 sm:text-sm xl:gap-3 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
          >
            {pending === id ? (
              <Spinner className="shrink-0 sm:size-5" />
            ) : (
              <Icon aria-hidden="true" className="size-4 shrink-0 sm:size-5" />
            )}
            <span className="truncate">{name}</span>
          </button>
        ))}
      </div>
    </>
  );
}

export function AuthFooter({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 text-center text-[13px] text-neutral-500 sm:mt-6 sm:text-sm xl:mt-7 xl:text-base dark:text-neutral-400">
      {children}
    </p>
  );
}
