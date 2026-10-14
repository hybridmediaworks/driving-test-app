import type { User } from "./user";

export type AuthResponse = {
  user: User;
  token: string;
};

export type SocialProvider = "google" | "facebook";

export type SocialAuthError =
  | "cancelled"
  | "invalid_state"
  | "email_missing"
  | "email_in_use"
  | "unavailable"
  | "failed";
