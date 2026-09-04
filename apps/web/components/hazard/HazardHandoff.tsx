"use client";

import { Eye } from "lucide-react";
import Button from "@/components/ui/Button";

/**
 * The "Now it's your turn" transition shown once the walkthrough hazards are done — from here on
 * nothing is highlighted and every hazard counts.
 */
export default function HazardHandoff({ remaining, onStart }: { remaining: number; onStart: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-neutral-950/80 p-4 text-center">
      <div className="max-w-md space-y-4">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white">
          <Eye className="h-7 w-7" />
        </span>
        <h2 className="text-2xl font-semibold text-white">Now it&apos;s your turn</h2>
        <p className="text-neutral-300">
          The hazards will no longer be highlighted. Click or tap anywhere a hazard is developing —
          as early as you safely can. There {remaining === 1 ? "is" : "are"}{" "}
          <span className="font-semibold text-white">{remaining}</span> to spot.
        </p>
        <Button onClick={onStart} size="md">
          I&apos;m ready
        </Button>
      </div>
    </div>
  );
}
