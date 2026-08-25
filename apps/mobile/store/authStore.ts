import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User } from "@driving-test-app/shared";

import { api, setToken } from "@/lib/api";

interface AuthState {
  user: User | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,

      async login(email, password) {
        const res = await api.post<{ user: User; token: string }>("/login", {
          email,
          password,
        });
        await setToken(res.token);
        set({ user: res.user });
      },

      async register(name, email, password, passwordConfirmation) {
        const res = await api.post<{ user: User; token: string }>(
          "/register",
          {
            name,
            email,
            password,
            password_confirmation: passwordConfirmation,
          },
        );
        await setToken(res.token);
        set({ user: res.user });
      },

      async logout() {
        try {
          await api.post("/logout");
        } catch {
          // token already invalid, proceed to clear local state
        }
        await setToken(null);
        set({ user: null });
      },

      async hydrate() {
        try {
          const res = await api.get<{ user: User }>("/me");
          set({ user: res.user });
        } catch {
          set({ user: null });
        } finally {
          set({ hydrated: true });
        }
      },
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
