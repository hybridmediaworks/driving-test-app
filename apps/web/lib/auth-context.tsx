"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@driving-test-app/shared";
import { api, setToken, ApiError } from "./api";
import { invalidatePhaseLadder } from "./phaseLadder";
import { invalidateResolvedQuiz } from "./useResolvedQuiz";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ user: User }>("/me")
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post<{ user: User; token: string }>("/login", { email, password });
    setToken(res.token);
    setUser(res.user);
    // Ladder lock/completion state is per-user — drop any cache built as a guest (or a previous
    // account) so the ladder reflects this user's entitlement and progress.
    invalidatePhaseLadder();
    invalidateResolvedQuiz();
  }

  async function register(name: string, email: string, password: string, passwordConfirmation: string) {
    const res = await api.post<{ user: User; token: string }>("/register", {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
    setToken(res.token);
    setUser(res.user);
    invalidatePhaseLadder();
    invalidateResolvedQuiz();
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
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
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

  async function performLogout(redirectTo = "/login") {
    if (pending) return;
    setPending(true);
    try {
      await logout();
      router.replace(redirectTo);
    } finally {
      setPending(false);
    }
  }

  return { logout: performLogout, pending };
}

/**
 * Derives straight from `user.entitlement` (already riding on `/me`) — no extra fetch. This is
 * UX-only: the backend re-checks entitlement on every gated request regardless of what this
 * reports, so it's safe to use for showing/hiding upgrade prompts but never the actual gate.
 */
export function useEntitlement() {
  const { user, loading } = useAuth();
  const entitlement = user?.entitlement ?? null;

  return {
    entitlement,
    loading,
    isPremium: entitlement?.is_premium ?? false,
    tier: entitlement?.tier ?? "guest",
  } as const;
}

export { ApiError };
