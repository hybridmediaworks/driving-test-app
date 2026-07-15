"use client";

import { useEffect, useState } from "react";

export type Appearance = "light" | "dark" | "system";

const STORAGE_KEY = "appearance";

export function applyTheme(value: Appearance): void {
  if (typeof window === "undefined") return;

  const isDark = value === "dark" || (value === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", isDark);
}

export function useAppearance() {
  // Defaults to "light", not "system" — the site's components are only styled for
  // light mode (no `dark:` variants anywhere), so auto-following the OS/browser's
  // dark-mode preference produces a half-styled, broken-looking page. Only switch
  // to dark/system if the user explicitly picks it from the toggle.
  const [appearance, setAppearance] = useState<Appearance>("light");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Appearance | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe: server/first client render both default to "light", then sync to the real stored value
    if (stored) setAppearance(stored);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange() {
      const current = (localStorage.getItem(STORAGE_KEY) as Appearance | null) ?? "light";
      applyTheme(current);
    }
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  function updateAppearance(value: Appearance) {
    setAppearance(value);
    localStorage.setItem(STORAGE_KEY, value);
    applyTheme(value);
  }

  return { appearance, updateAppearance };
}
