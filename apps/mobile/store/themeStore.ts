import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ColorSchemePreference = "light" | "dark";

interface ThemeState {
  preference: ColorSchemePreference;
  setPreference: (p: ColorSchemePreference) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: "light",
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: "theme-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
