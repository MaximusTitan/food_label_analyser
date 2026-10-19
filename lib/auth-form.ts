import { z } from "zod";

export const MIN_PASSWORD_LENGTH = 8;
/** bcrypt, which Supabase uses, ignores bytes past 72. */
export const MAX_PASSWORD_LENGTH = 72;

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
});

export const AUTH_ERROR_CODES = [
  "invalid_input",
  "invalid_credentials",
  "email_taken",
  "weak_password",
  "rate_limited",
  "signup_failed",
  "not_configured",
] as const;
export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

export interface AuthFormState {
  error: AuthErrorCode | null;
  /** Echoed back so the field keeps its value after a failed attempt. */
  email: string;
}

export const INITIAL_AUTH_STATE: AuthFormState = { error: null, email: "" };
