"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { AuthResponse, User } from "@driving-test-app/shared";
import { api, getToken, setToken, ApiError } from "./api";
import { syncEmailUnverifiedCookie } from "./emailVerificationGate";
import { currentPath, loginHref } from "./redirect";
import { invalidatePhaseLadder } from "./phaseLadder";
import { invalidateResolvedQuiz } from "./useResolvedQuiz";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
    checkoutPlan?: string | null,
  ) => Promise<void>;
  loginWithSocialCode: (code: string) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshSeq = useRef(0);

  const setUser = useCallback((next: User | null) => {
    syncEmailUnverifiedCookie(next);
    setUserState(next);
  }, []);

  const refreshUser = useCallback(async () => {
    const seq = ++refreshSeq.current;
    const next = getToken()
      ? await api.get<{ user: User }>("/me").then(
          (res) => res.user,
          () => null,
        )
      : null;
    if (seq === refreshSeq.current) setUser(next);
  }, [setUser]);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    function syncAcrossTabs(event: StorageEvent) {
      if (event.key !== null && event.key !== "auth_token") return;
      invalidatePhaseLadder();
      invalidateResolvedQuiz();
      refreshUser();
    }

    window.addEventListener("storage", syncAcrossTabs);
    return () => window.removeEventListener("storage", syncAcrossTabs);
  }, [refreshUser]);

  async function login(email: string, password: string) {
    const res = await api.post<{ user: User; token: string }>("/login", { email, password });
    setToken(res.token);
    setUser(res.user);
    // Ladder lock/completion state is per-user — drop any cache built as a guest (or a previous
    // account) so the ladder reflects this user's entitlement and progress.
    invalidatePhaseLadder();
    invalidateResolvedQuiz();
  }

  async function register(
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
    checkoutPlan?: string | null,
  ) {
    const res = await api.post<{ user: User; token: string }>("/register", {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
      // The plan picked on /pricing (if any): the server keeps it so the verification link can
      // resume checkout even when it's opened in a different browser.
      checkout_plan: checkoutPlan ?? null,
    });
    setToken(res.token);
    setUser(res.user);
    invalidatePhaseLadder();
    invalidateResolvedQuiz();
  }

  async function loginWithSocialCode(code: string) {
    const res = await api.post<AuthResponse>("/auth/social/exchange", { code });
    setToken(res.token);
    setUser(res.user);
    invalidatePhaseLadder();
    invalidateResolvedQuiz();
    return res.user;
  }

  async function logout() {
    try {
      await api.post("/logout");
    } catch {
      // token already invalid, proceed to clear local state
    }
    setToken(null);
    setUser(null);
    invalidatePhaseLadder();
    invalidateResolvedQuiz();
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithSocialCode, logout, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/**
 * The single place every "Log out" trigger in the app should call through, instead of calling
 * `useAuth().logout()` directly — wraps the raw API call + token/user clearing with a consistent
 * redirect and a `pending` flag, so every button behaves the same (and can't double-fire) no
 * matter which page it lives on, rather than each call site improvising its own navigation (or
 * relying on a route guard to notice `user` went null).
 */
export function useLogout() {
  const { logout } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function performLogout(redirectTo?: string) {
    if (pending) return;
    setPending(true);
    try {
      await logout();
      router.replace(redirectTo ?? loginHref(currentPath()));
    } finally {
      setPending(false);
    }
  }

  return { logout: performLogout, pending };
}

export function useRedirectIfAuthenticated(to: string) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const checked = useRef(false);

  useEffect(() => {
    if (loading || checked.current) return;
    checked.current = true;
    if (user) router.replace(to);
  }, [loading, user, to, router]);
}

/**
 * Derives straight from `user.entitlement` (already riding on `/me`) — no extra fetch. This is
 * UX-only: the backend re-checks entitlement on every gated request regardless of what this
 * reports, so it's safe to use for showing/hiding upgrade prompts but never the actual gate.
 */
export function useEntitlement() {
  const { user, loading } = useAuth();
  const entitlement = user?.entitlement ?? null;
  const isPremium = entitlement?.is_premium ?? false;
  const premiumVehicleTypes = entitlement?.premium_vehicle_types ?? [];

  function isPremiumFor(vehicle: string | null | undefined): boolean {
    if (!vehicle || user?.is_admin) return isPremium;
    return premiumVehicleTypes.includes(vehicle.toLowerCase());
  }

  return {
    entitlement,
    loading,
    isPremium,
    premiumVehicleTypes,
    isPremiumFor,
    tier: entitlement?.tier ?? "guest",
  } as const;
}

export { ApiError };
