"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { credentialsSchema, type AuthErrorCode, type AuthFormState } from "@/lib/auth-form";
import { createRateLimiter } from "./rate-limit";

const checkLogin = createRateLimiter({ limit: 10, windowMs: 5 * 60_000 });
// Every sign-up and resend sends an email, and Supabase's email quota is small,
// so keep these strict.
const checkSignup = createRateLimiter({ limit: 5, windowMs: 15 * 60_000 });
const checkResend = createRateLimiter({ limit: 3, windowMs: 15 * 60_000 });

async function clientIp(): Promise<string> {
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "anonymous";
}

/**
 * Where the confirmation email links back to. Supabase only follows it if it
 * is on the project's Redirect URLs allow list.
 */
async function confirmUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const origin =
    h.get("origin") ?? (host ? `${h.get("x-forwarded-proto") ?? "https"}://${host}` : "http://localhost:3000");
  return new URL("/auth/confirm", origin).toString();
}

function fail(error: AuthErrorCode, email = ""): AuthFormState {
  return { error, email };
}

function formEmail(formData: FormData): string {
  const value = formData.get("email");
  return typeof value === "string" ? value : "";
}

function readCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = readCredentials(formData);
  const email = formEmail(formData);
  if (!parsed.success) return fail("invalid_input", email);

  if (!checkLogin(await clientIp()).allowed) return fail("rate_limited", email);

  const supabase = await createClient();
  if (!supabase) return fail("not_configured", email);

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.status === 429) return fail("rate_limited", email);
    if (error.code === "email_not_confirmed") return fail("email_not_confirmed", email);
    // One message for unknown email and wrong password, so accounts can't be probed.
    return fail("invalid_credentials", email);
  }

  redirect("/");
}

export async function signup(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = readCredentials(formData);
  const email = formEmail(formData);
  if (!parsed.success) {
    const passwordIssue = parsed.error.issues.some((issue) => issue.path[0] === "password");
    return fail(passwordIssue ? "weak_password" : "invalid_input", email);
  }

  if (!checkSignup(await clientIp()).allowed) return fail("rate_limited", email);

  const supabase = await createClient();
  if (!supabase) return fail("not_configured", email);

  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: await confirmUrl() },
  });
  if (error) {
    if (error.code === "email_exists" || error.code === "user_already_exists") {
      return fail("email_taken", email);
    }
    if (error.code === "weak_password") return fail("weak_password", email);
    if (error.status === 429 || error.code === "over_email_send_rate_limit") return fail("rate_limited", email);
    // Codes only: never log the email, password or keys.
    console.error("signup: signUp failed", {
      code: error.code ?? null,
      status: error.status ?? null,
      name: error.name,
    });
    return fail("signup_failed", email);
  }

  // "Confirm email" is switched off in the dashboard, so Supabase signed them in.
  if (data.session) redirect("/");

  // With "Confirm email" on, an address that already has an account comes back
  // as a user with no identities and no email is sent.
  if (data.user && data.user.identities?.length === 0) return fail("email_taken", email);

  return { error: null, email: parsed.data.email, notice: "check_email" };
}

export async function resendConfirmation(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = credentialsSchema.shape.email.safeParse(formData.get("email"));
  const email = formEmail(formData);
  if (!parsed.success) return fail("invalid_input", email);

  if (!checkResend(await clientIp()).allowed) return fail("rate_limited", email);

  const supabase = await createClient();
  if (!supabase) return fail("not_configured", email);

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data,
    options: { emailRedirectTo: await confirmUrl() },
  });
  if (error?.status === 429) return fail("rate_limited", email);
  // Any other outcome looks the same, so this can't be used to probe accounts.
  return { error: null, email: parsed.data, notice: "resent" };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/login");
}
