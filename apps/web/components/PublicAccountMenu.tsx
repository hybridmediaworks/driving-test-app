"use client";

import { ChevronDown, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { User } from "@driving-test-app/shared";
import UserInfo from "@/components/app/UserInfo";
import { useAuth } from "@/lib/auth-context";

/**
 * Account dropdown for the public marketing header, built the same manual (state + click-outside)
 * way as Header.tsx's state/car/testType dropdowns, so its hover styling (incl. icon color) behaves
 * identically to them instead of relying on the Base UI menu's focus-driven styling.
 */
export default function PublicAccountMenu({ user }: { user: User }) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
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
        className="flex h-11.5 items-center gap-2 rounded-full bg-blue-50 py-1 pr-3 pl-1 text-base font-medium text-blue-700 transition-shadow hover:shadow-md"
      >
        <UserInfo user={user} />
        <ChevronDown className="h-5 w-5 shrink-0 text-blue-500" />
      </button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 overflow-hidden w-64 rounded-2xl border border-gray-100 bg-white shadow-xl">
          <div className="flex items-center gap-2 px-4 py-2.5">
            <UserInfo user={user} showEmail />
          </div>
          <div className="h-px bg-gray-100" />
          <Link
            href="/settings/profile"
            onClick={() => setOpen(false)}
            className="group flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-blue-50 hover:text-blue-700"
          >
            <Settings className="h-4 w-4 text-blue-500 group-hover:text-blue-700" />
            Settings
          </Link>
          <div className="h-px bg-gray-100" />
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="group w-full flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-blue-50 hover:text-blue-700"
          >
            <LogOut className="h-4 w-4 text-blue-500 group-hover:text-blue-700" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
