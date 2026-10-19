import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { connection } from "next/server";

import { supabaseEnv } from "./env";

/**
 * Per-request client that acts as the signed-in user, so Row Level Security
 * applies to every query. Returns null when Supabase isn't configured.
 */
export async function createClient(): Promise<SupabaseClient | null> {
  const env = supabaseEnv();
  if (!env) return null;
  // Session checks compare token expiry with Date.now(), so they must only run
  // for a real request, never while Next.js prerenders or prefetches.
  await connection();
  const cookieStore = await cookies();

  return createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components can't set cookies; proxy.ts refreshes the session instead.
        }
      },
    },
  });
}
