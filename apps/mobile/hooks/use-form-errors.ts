import { useCallback, useState } from "react";

/** Same shape the API returns (`{ field: ["message", …] }`), so client and server errors merge. */
export type FieldErrors = Record<string, string[]>;

/**
 * Standardises how the auth/report forms track validation errors: a `{ field: [messages] }` map that
 * accepts both client-side checks (from lib/validation) and the API's 422 body unchanged. `clearError`
 * wipes one field's error the moment the user edits it, so a corrected field stops showing red before
 * the next submit — the small touch that makes validation feel responsive rather than punitive.
 */
export function useFormErrors(initial: FieldErrors = {}) {
  const [errors, setErrors] = useState<FieldErrors>(initial);

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  /** First message for a field, ready to hand to <Input error={…} />. */
  const errorFor = useCallback((field: string) => errors[field]?.[0], [errors]);

  return { errors, setErrors, clearError, errorFor };
}
