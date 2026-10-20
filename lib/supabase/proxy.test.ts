import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ claims: null as Record<string, unknown> | null, refresh: false }));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    { cookies }: { cookies: { setAll: (c: unknown[], h: Record<string, string>) => void } },
  ) => ({
    auth: {
      getClaims: async () => {
        if (mocks.refresh) {
          cookies.setAll([{ name: "sb-token", value: "fresh", options: { path: "/" } }], {
            "Cache-Control": "private, no-store",
          });
        }
        return { data: mocks.claims ? { claims: mocks.claims } : null, error: null };
      },
    },
  }),
}));

const { updateSession } = await import("./proxy");

const request = (path: string) => new NextRequest(new URL(path, "http://localhost:3000"));

describe("updateSession", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    mocks.claims = null;
    mocks.refresh = false;
  });
  afterEach(() => vi.unstubAllEnvs());

  it("sends signed-out visitors to the login page", async () => {
    const res = await updateSession(request("/history"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("lets signed-out visitors open login and signup", async () => {
    expect((await updateSession(request("/login"))).headers.get("location")).toBeNull();
    expect((await updateSession(request("/signup"))).headers.get("location")).toBeNull();
  });

  it("sends signed-in users away from the auth pages", async () => {
    mocks.claims = { sub: "u1" };
    const res = await updateSession(request("/login"));
    expect(res.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("lets signed-in users through", async () => {
    mocks.claims = { sub: "u1" };
    expect((await updateSession(request("/history"))).headers.get("location")).toBeNull();
  });

  it("lets anyone open the email confirmation link", async () => {
    expect((await updateSession(request("/auth/confirm?code=abc"))).headers.get("location")).toBeNull();
    mocks.claims = { sub: "u1" };
    expect((await updateSession(request("/auth/confirm?code=abc"))).headers.get("location")).toBeNull();
  });

  it("never redirects API calls", async () => {
    expect((await updateSession(request("/api/analyze"))).headers.get("location")).toBeNull();
  });

  it("keeps refreshed session cookies on redirects", async () => {
    mocks.refresh = true;
    const res = await updateSession(request("/"));
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
    expect(res.cookies.get("sb-token")?.value).toBe("fresh");
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });

  it("does nothing when Supabase is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect((await updateSession(request("/history"))).headers.get("location")).toBeNull();
  });
});
