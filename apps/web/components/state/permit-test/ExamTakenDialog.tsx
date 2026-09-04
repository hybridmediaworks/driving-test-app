"use client";

import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Where to send someone who wants to leave a review. Not hardcoded because the review page is an
 * account-level URL nobody can guess — set NEXT_PUBLIC_TRUSTPILOT_REVIEW_URL (e.g.
 * https://www.trustpilot.com/evaluate/yourdomain.com) and the button appears. Left unset, the
 * dialog still congratulates them; it just doesn't offer a link that goes nowhere.
 */
const REVIEW_URL = process.env.NEXT_PUBLIC_TRUSTPILOT_REVIEW_URL;

/**
 * Shown when a learner says they've sat the written exam. There's nothing to record — the API has
 * no concept of an exam having been taken — so this does the one thing that moment is actually
 * good for: asking someone at the finish line to say how it went.
 *
 * The review count matches the claim the site already makes in its heroes ("4.7/5 from 38,000+
 * students") rather than introducing a second, different number.
 */
export default function ExamTakenDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/state-hub/leave-review.svg"
          alt=""
          aria-hidden
          className="w-full"
        />

        <div className="flex flex-col items-center gap-3 px-6 pt-5 pb-8 text-center">
          <DialogTitle className="font-sora text-2xl font-semibold text-neutral-900">
            Congratulations!
          </DialogTitle>
          <DialogDescription className="text-base leading-6 text-neutral-700">
            Your journey matters to us, and your feedback fuels our passion to
            improve and provide the best learning tools for drivers across the
            country.
          </DialogDescription>

          {REVIEW_URL && (
            <>
              <a
                href={REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-green-600"
              >
                Review us on
                <Star className="size-5 fill-white" strokeWidth={0} />
                Trustpilot
              </a>
              <p className="text-xs text-neutral-500">
                more than 38,000 users have already left a review
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
