import { RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";

/**
 * Confirmation shown before restarting a quiz, so progress isn't wiped by an accidental tap.
 * Matches the PremiumDialog layout (illustration on top, copy + actions below).
 */
export default function RestartDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md! gap-0 overflow-hidden rounded-3xl p-0">
        <div className="relative flex h-48 items-center justify-center bg-background2">
          {/* emphasis strokes */}
          <svg
            className="absolute right-24 top-12 text-neutral-800"
            width="44"
            height="44"
            viewBox="0 0 44 44"
            fill="none"
            aria-hidden
          >
            <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="30" y1="16" x2="42" y2="8" />
              <line x1="26" y1="6" x2="30" y2="-6" />
              <line x1="34" y1="28" x2="46" y2="26" />
            </g>
          </svg>

          {/* phone with restart icon */}
          <div className="-rotate-12 rounded-2xl border-2 border-neutral-800 bg-white p-5 shadow-sm">
            <RotateCcw className="h-12 w-12 text-blue-600" strokeWidth={2.5} />
          </div>
        </div>

        <div className="space-y-4 bg-white p-8 text-center">
          <Heading size="xs">Restart your test?</Heading>
          <Paragraph className="text-center">
            Are you sure you want to restart your test? Your test progress will be lost.
          </Paragraph>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 border border-blue-300 hover:bg-blue-50"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className="flex-1"
            >
              Restart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
