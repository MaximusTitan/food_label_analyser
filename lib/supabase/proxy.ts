import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseEnv } from "./env";

/** Pages anyone can open. Everything else needs a signed-in user. */
export const AUTH_PAGES = ["/login", "/signup"];
/** The email confirmation link lands here, signed in or not. */
const OPEN_PATHS = ["/auth/confirm"];

function isAuthPage(pathname: string) {
  return AUTH_PAGES.includes(pathname);
}

/**
 * Refreshes the Supabase session cookie on every request and does an
 * optimistic redirect. Pages and the API still verify the user themselves.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const env = supabaseEnv();
  if (!env) return response;

  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  // Must run before any response is built so a refreshed token is written back.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  // The API answers 401 itself rather than redirecting.
  if (pathname.startsWith("/api/") || OPEN_PATHS.includes(pathname)) return response;

  let target: string | null = null;
  if (!signedIn && !isAuthPage(pathname)) target = "/login";
  if (signedIn && isAuthPage(pathname)) target = "/";
  if (!target) return response;

  const redirect = NextResponse.redirect(new URL(target, request.url));
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  redirect.headers.set("Cache-Control", "private, no-store");
  return redirect;
}
