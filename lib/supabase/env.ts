export interface SupabaseEnv {
  url: string;
  publishableKey: string;
}

let warned = false;

/** Accepts only a bare origin such as https://<ref>.supabase.co (or http://localhost for local Supabase). */
export function isValidSupabaseUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  return (
    (url.protocol === "https:" || (local && url.protocol === "http:")) &&
    (url.pathname === "/" || url.pathname === "") &&
    !url.search &&
    !url.hash
  );
}

/** Public project settings. Returns null until the project is configured correctly. */
export function supabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) return null;
  if (!isValidSupabaseUrl(url)) {
    if (!warned) {
      warned = true;
      console.error(
        "NEXT_PUBLIC_SUPABASE_URL is not a valid project URL. Expected https://<project-ref>.supabase.co",
      );
    }
    return null;
  }
  return { url: url.replace(/\/$/, ""), publishableKey };
}
