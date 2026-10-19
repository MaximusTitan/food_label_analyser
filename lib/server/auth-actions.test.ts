import { beforeEach, describe, expect, it, vi } from "vitest";

import { INITIAL_AUTH_STATE } from "@/lib/auth-form";

const mocks = vi.hoisted(() => {
  class RedirectError extends Error {
    constructor(public readonly url: string) {
      super(`redirect ${url}`);
    }
  }
  return {
    RedirectError,
    createUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    adminConfigured: true,
    serverConfigured: true,
    ip: "198.51.100.1",
  };
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new mocks.RedirectError(url);
  },
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": mocks.ip }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () =>
    mocks.adminConfigured ? { auth: { admin: { createUser: mocks.createUser } } } : null,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () =>
    mocks.serverConfigured
      ? { auth: { signInWithPassword: mocks.signInWithPassword, signOut: mocks.signOut } }
      : null,
}));

const { login, logout, signup } = await import("./auth-actions");

let ipCount = 0;

function form(email: string, password: string) {
  const data = new FormData();
  data.set("email", email);
  data.set("password", password);
  return data;
}

async function redirectTarget(promise: Promise<unknown>) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(mocks.RedirectError);
  return (error as InstanceType<typeof mocks.RedirectError>).url;
}

beforeEach(() => {
  mocks.createUser.mockReset().mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
  mocks.signInWithPassword.mockReset().mockResolvedValue({ data: {}, error: null });
  mocks.signOut.mockReset().mockResolvedValue({ error: null });
  mocks.adminConfigured = true;
  mocks.serverConfigured = true;
  // A fresh IP per test keeps the module-level rate limiters out of the way.
  ipCount += 1;
  mocks.ip = `198.51.100.${ipCount}`;
});

describe("signup", () => {
  it("creates a pre-confirmed user, signs them in and goes home", async () => {
    const target = await redirectTarget(signup(INITIAL_AUTH_STATE, form(" Kid@Example.com ", "carrots123")));
    expect(target).toBe("/");
    expect(mocks.createUser).toHaveBeenCalledWith({
      email: "kid@example.com",
      password: "carrots123",
      email_confirm: true,
    });
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({ email: "kid@example.com", password: "carrots123" });
  });

  it("rejects short passwords before calling Supabase", async () => {
    const state = await signup(INITIAL_AUTH_STATE, form("kid@example.com", "short"));
    expect(state).toEqual({ error: "weak_password", email: "kid@example.com" });
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("rejects invalid emails", async () => {
    const state = await signup(INITIAL_AUTH_STATE, form("not-an-email", "carrots123"));
    expect(state.error).toBe("invalid_input");
  });

  it("reports an existing account", async () => {
    mocks.createUser.mockResolvedValue({ data: { user: null }, error: { code: "email_exists" } });
    const state = await signup(INITIAL_AUTH_STATE, form("kid@example.com", "carrots123"));
    expect(state.error).toBe("email_taken");
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("does not leak unexpected Supabase errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.createUser.mockResolvedValue({ data: { user: null }, error: { code: "unexpected_failure", message: "db down" } });
    const state = await signup(INITIAL_AUTH_STATE, form("kid@example.com", "carrots123"));
    expect(state).toEqual({ error: "signup_failed", email: "kid@example.com" });
  });

  it("reports not_configured without the secret key", async () => {
    mocks.adminConfigured = false;
    const state = await signup(INITIAL_AUTH_STATE, form("kid@example.com", "carrots123"));
    expect(state.error).toBe("not_configured");
  });

  it("rate limits sign-ups per IP", async () => {
    for (let i = 0; i < 5; i += 1) {
      await signup(INITIAL_AUTH_STATE, form(`kid${i}@example.com`, "carrots123")).catch(() => {});
    }
    const state = await signup(INITIAL_AUTH_STATE, form("kid9@example.com", "carrots123"));
    expect(state.error).toBe("rate_limited");
  });
});

describe("login", () => {
  it("signs in and goes home", async () => {
    expect(await redirectTarget(login(INITIAL_AUTH_STATE, form("kid@example.com", "carrots123")))).toBe("/");
  });

  it("uses one message for any bad credentials", async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: {}, error: { status: 400, code: "invalid_credentials" } });
    const state = await login(INITIAL_AUTH_STATE, form("kid@example.com", "carrots123"));
    expect(state).toEqual({ error: "invalid_credentials", email: "kid@example.com" });
  });

  it("rate limits attempts per IP", async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: {}, error: { status: 400 } });
    for (let i = 0; i < 10; i += 1) await login(INITIAL_AUTH_STATE, form("kid@example.com", "carrots123"));
    const state = await login(INITIAL_AUTH_STATE, form("kid@example.com", "carrots123"));
    expect(state.error).toBe("rate_limited");
  });
});

describe("logout", () => {
  it("signs out and returns to the login page", async () => {
    expect(await redirectTarget(logout())).toBe("/login");
    expect(mocks.signOut).toHaveBeenCalled();
  });
});
