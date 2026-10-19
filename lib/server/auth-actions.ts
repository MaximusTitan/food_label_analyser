"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { credentialsSchema, type AuthErrorCode, type AuthFormState } from "@/lib/auth-form";
import { createRateLimiter } from "./rate-limit";

const checkLogin = createRateLimiter({ limit: 10, windowMs: 5 * 60_000 });
// Accounts are created with the service key, which skips Supabase's own
// sign-up rate limits, so keep this one strict.
const checkSignup = createRateLimiter({ limit: 5, windowMs: 15 * 60_000 });

async function clientIp(): Promise<string> {
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "anonymous";
}

function fail(error: AuthErrorCode, email = ""): AuthFormState {
  return { error, email };
}

function readCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = readCredentials(formData);
  const email = typeof formData.get("email") === "string" ? String(formData.get("email")) : "";
  if (!parsed.success) return fail("invalid_input", email);

  if (!checkLogin(await clientIp()).allowed) return fail("rate_limited", email);

  const supabase = await createClient();
  if (!supabase) return fail("not_configured", email);

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // One message for unknown email and wrong password, so accounts can't be probed.
  if (error) return fail(error.status === 429 ? "rate_limited" : "invalid_credentials", email);

  redirect("/");
}

export async function signup(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = readCredentials(formData);
  const email = typeof formData.get("email") === "string" ? String(formData.get("email")) : "";
  if (!parsed.success) {
    const passwordIssue = parsed.error.issues.some((issue) => issue.path[0] === "password");
    return fail(passwordIssue ? "weak_password" : "invalid_input", email);
  }

  if (!checkSignup(await clientIp()).allowed) return fail("rate_limited", email);

  const admin = createAdminClient();
  const supabase = await createClient();
  if (!admin || !supabase) return fail("not_configured", email);

  // Created already confirmed, so no confirmation email is sent or needed.
  const { error: createError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });
  if (createError) {
    if (createError.code === "email_exists" || createError.code === "user_already_exists") {
      return fail("email_taken", email);
    }
    if (createError.code === "weak_password") return fail("weak_password", email);
    // Codes only: never log the email, password or keys.
    console.error("signup: createUser failed", {
      code: createError.code ?? null,
      status: createError.status ?? null,
      name: createError.name,
    });
    return fail("signup_failed", email);
  }

  const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
  if (signInError) redirect("/login");

  redirect("/");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/login");
}
