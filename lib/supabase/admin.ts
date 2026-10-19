import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { supabaseEnv } from "./env";

/**
 * Service client that bypasses Row Level Security. Only used to create
 * pre-confirmed accounts at sign-up; never use it to read or write user data.
 */
export function createAdminClient(): SupabaseClient | null {
  const env = supabaseEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!env || !secretKey) return null;
  return createClient(env.url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
