import { Loader2 } from "lucide-react";

export default function Spinner({ className = "" }: { className?: string }) {
  return <Loader2 role="status" aria-label="Loading" className={`size-4 animate-spin ${className}`} />;
}
