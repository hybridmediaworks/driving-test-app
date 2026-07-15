import { useThemeStore } from "@/store/themeStore";

/** Returns true when the app theme preference is dark. */
export function useIsDark(): boolean {
  return useThemeStore((s) => s.preference === "dark");
}
