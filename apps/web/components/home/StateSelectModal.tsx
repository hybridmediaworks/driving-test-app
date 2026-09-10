"use client";

import { X } from "lucide-react";
import { usStates } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

export default function StateSelectModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { setSelectedState } = useWebLayout();

  if (!open) return null;

  function selectState(state: string) {
    setSelectedState(state);
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-gray-100 dark:border-white/10 bg-white dark:bg-neutral-800 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Select your state</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid max-h-100 grid-cols-2 gap-0.5 overflow-y-auto text-sm sm:grid-cols-3">
          {usStates.map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => selectState(state)}
              className="cursor-pointer rounded-lg px-3 py-2 text-left text-gray-700 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
            >
              {state}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
