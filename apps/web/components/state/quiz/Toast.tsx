import { createPortal } from "react-dom";
import { CheckCircle2, X, XCircle } from "lucide-react";

export type ToastVariant = "success" | "error";

/**
 * Lightweight toast, fixed near the top-center. Rendered in a portal on document.body so it's never
 * trapped beneath a dialog's stacking context. The parent controls visibility and auto-dismiss.
 */
export default function Toast({
  message,
  variant = "success",
  onDismiss,
}: {
  message: string;
  variant?: ToastVariant;
  onDismiss: () => void;
}) {
  if (typeof document === "undefined") return null;

  const isError = variant === "error";
  return createPortal(
    <div
      role="status"
      className={`toast-in fixed left-1/2 top-6 z-[100] flex max-w-[min(92vw,420px)] -translate-x-1/2 items-start gap-3 rounded-2xl border bg-white p-4 shadow-[0_20px_50px_-20px_rgba(23,37,84,0.35)] ${
        isError ? "border-red-200" : "border-green-200"
      }`}
    >
      {isError ? (
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
      )}
      <p className="flex-1 text-sm text-neutral-700">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-neutral-400 transition-colors hover:text-neutral-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>,
    document.body,
  );
}
