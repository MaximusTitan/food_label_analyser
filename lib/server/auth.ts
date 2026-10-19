import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export interface CurrentUser {
  id: string;
  email: string | null;
}

/**
 * Data Access Layer entry point: verifies the session JWT on the server.
 * Returns null when signed out or when Supabase isn't configured.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
