// Small, dependency-free form validators. Each returns an error string when the value is invalid,
// or `undefined` when it's fine — so a form can build its `{ field: message }` map by calling these
// and dropping the `undefined`s. Keeping the shape as plain strings (not arrays) lets these sit
// next to the API's `Record<string, string[]>` errors: read the first element there, a bare string
// here, and feed either into <Input error={...} />.

// Intentionally permissive: "something@something.tld". Real deliverability is the backend's job — we
// only catch obvious typos client-side so the user gets instant feedback instead of a round-trip.
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Minimum length Laravel's default password rule enforces server-side — mirror it for new passwords. */
export const PASSWORD_MIN_LENGTH = 8;

export function validateRequired(value: string, label: string): string | undefined {
  if (!value.trim()) return `${label} is required`;
  return undefined;
}

export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return "Email is required";
  if (!EMAIL_REGEX.test(email)) return "Enter a valid email address";
  return undefined;
}

/** Login / confirm flows: the password already exists, so only presence matters (never length). */
export function validatePasswordPresent(value: string): string | undefined {
  if (!value) return "Password is required";
  return undefined;
}

/** Register / reset flows: a *new* password, so enforce the same minimum the API will. */
export function validateNewPassword(value: string): string | undefined {
  if (!value) return "Password is required";
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  return undefined;
}

export function validateMatch(
  value: string,
  other: string,
  message = "Passwords do not match",
): string | undefined {
  if (value !== other) return message;
  return undefined;
}

/**
 * Collapses a set of validators into the `Record<string, string[]>` shape the auth screens already
 * use for API errors, so a screen can merge client-side and server-side errors through one setter.
 * Fields whose validator returned `undefined` are omitted.
 */
export function collectErrors(
  fields: Record<string, string | undefined>,
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const [key, message] of Object.entries(fields)) {
    if (message) errors[key] = [message];
  }
  return errors;
}
