"use client";

import { ChevronDown, LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { User } from "@driving-test-app/shared";
import UserInfo from "@/components/app/UserInfo";
import Switch from "@/components/ui/Switch";
import { useAppearance } from "@/lib/appearance";
import { useAuth } from "@/lib/auth-context";

/**
 * Account dropdown for the public marketing header, built the same manual (state + click-outside)
 * way as Header.tsx's state/car/testType dropdowns, so its hover styling (incl. icon color) behaves
 * identically to them instead of relying on the Base UI menu's focus-driven styling.
 */

const studyModes = [
  { label: "Tests", value: "tests" },
  { label: "Flashcards", value: "flashcards" },
] as const;

type StudyMode = (typeof studyModes)[number]["value"];

const rowClasses =
  "block w-full cursor-pointer px-4 py-3 text-left text-sm text-neutral-700 hover:bg-blue-50 hover:text-blue-600 dark:text-neutral-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-400";

export default function PublicAccountMenu({ user }: { user: User }) {
  const { logout } = useAuth();
  const { appearance, updateAppearance } = useAppearance();
  const [open, setOpen] = useState(false);
  // UI only for now — the picked mode isn't persisted or read by any surface yet; wire it into the
  // study preferences (alongside state/vehicle/test type) when the Tests/Flashcards split lands.
  const [studyMode, setStudyMode] = useState<StudyMode>("tests");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-11.5 items-center gap-2 rounded-full bg-blue-50 py-1 pr-3 pl-1 text-base font-medium text-blue-700 transition-shadow hover:shadow-md dark:bg-blue-500/10 dark:text-blue-300"
      >
        <UserInfo user={user} />
        <ChevronDown className="h-5 w-5 shrink-0 text-blue-500" />
      </button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl dark:border-white/10 dark:bg-neutral-800">
          <div className="flex items-center gap-2 px-4 py-2.5">
            <UserInfo user={user} showEmail />
          </div>
          <div className="h-px bg-gray-100 dark:bg-neutral-700" />

          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm text-neutral-700 dark:text-neutral-300">Night Mode</span>
            <Switch
              checked={appearance === "dark"}
              onCheckedChange={(checked) => updateAppearance(checked ? "dark" : "light")}
            />
          </div>
          <div className="h-px bg-gray-100 dark:bg-neutral-700" />

          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm text-neutral-700 dark:text-neutral-300">Study mode</span>
            <div role="radiogroup" aria-label="Study mode" className="flex items-center gap-4">
              {studyModes.map((mode) => {
                const isSelected = studyMode === mode.value;
                return (
                  <label
                    key={mode.value}
                    className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"
                  >
                    <input
                      type="radio"
                      name="study-mode"
                      value={mode.value}
                      checked={isSelected}
                      onChange={() => setStudyMode(mode.value)}
                      className="peer sr-only"
                    />
                    <span
                      className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-neutral-800 ${
                        isSelected
                          ? "border-blue-600 dark:border-blue-400"
                          : "border-neutral-300 dark:border-neutral-600"
                      }`}
                    >
                      {isSelected && (
                        <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                      )}
                    </span>
                    {mode.label}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="h-px bg-gray-100 dark:bg-neutral-700" />

          {/* Both settings links point at the same settings area for now — the study program
              (state / vehicle / test type) doesn't have its own settings page yet. */}
          <Link href="/settings/profile" onClick={() => setOpen(false)} className={rowClasses}>
            Study Program Settings
          </Link>
          <div className="h-px bg-gray-100 dark:bg-neutral-700" />

          <Link href="/settings/profile" onClick={() => setOpen(false)} className={rowClasses}>
            Account Settings
          </Link>
          <div className="h-px bg-gray-100 dark:bg-neutral-700" />

          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className={`group flex items-center gap-3 ${rowClasses}`}
          >
            <LogOut className="h-4 w-4 text-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
