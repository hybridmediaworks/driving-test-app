"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useAppearance, type Appearance } from "@/lib/appearance";

const tabs: { value: Appearance; Icon: typeof Sun; label: string }[] = [
  { value: "light", Icon: Sun, label: "Light" },
  { value: "dark", Icon: Moon, label: "Dark" },
  { value: "system", Icon: Monitor, label: "System" },
];

export default function AppearanceTabs() {
  const { appearance, updateAppearance } = useAppearance();

  return (
    <div className="inline-flex gap-1 rounded-lg bg-neutral-100 p-1">
      {tabs.map(({ value, Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => updateAppearance(value)}
          className={`flex items-center rounded-md px-3.5 py-1.5 transition-colors ${
            appearance === value
              ? "bg-white shadow-xs"
              : "text-neutral-500 hover:bg-neutral-200/60 hover:text-black"
          }`}
        >
          <Icon className="-ml-1 h-4 w-4" />
          <span className="ml-1.5 text-sm">{label}</span>
        </button>
      ))}
    </div>
  );
}
