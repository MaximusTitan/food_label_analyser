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
    signUp: vi.fn(),
    resend: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
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
  headers: async () => new Headers({ "x-forwarded-for": mocks.ip, origin: "https://snacks.example" }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () =>
    mocks.serverConfigured
      ? {
          auth: {
            signUp: mocks.signUp,
            resend: mocks.resend,
            signInWithPassword: mocks.signInWithPassword,
            signOut: mocks.signOut,
          },
        }
      : null,
}));

const { login, logout, resendConfirmation, signup } = await import("./auth-actions");

const CONFIRM_URL = "https://snacks.example/auth/confirm";

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
  mocks.signUp
    .mockReset()
    .mockResolvedValue({ data: { user: { id: "u1", identities: [{ id: "i1" }] }, session: null }, error: null });
  mocks.resend.mockReset().mockResolvedValue({ data: {}, error: null });
  mocks.signInWithPassword.mockReset().mockResolvedValue({ data: {}, error: null });
  mocks.signOut.mockReset().mockResolvedValue({ error: null });
  mocks.serverConfigured = true;
  // A fresh IP per test keeps the module-level rate limiters out of the way.
  ipCount += 1;
  mocks.ip = `198.51.100.${ipCount}`;
});

describe("signup", () => {
  it("sends a confirmation email that links back to /auth/confirm", async () => {
    const state = await signup(INITIAL_AUTH_STATE, form(" Kid@Example.com ", "carrots123"));
    expect(state).toEqual({ error: null, email: "kid@example.com", notice: "check_email" });
    expect(mocks.signUp).toHaveBeenCalledWith({
      email: "kid@example.com",
      password: "carrots123",
      options: { emailRedirectTo: CONFIRM_URL },
    });
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("goes home when Supabase signs the user in straight away", async () => {
    mocks.signUp.mockResolvedValue({ data: { user: { id: "u1" }, session: { access_token: "t" } }, error: null });
    expect(await redirectTarget(signup(INITIAL_AUTH_STATE, form("kid@example.com", "carrots123")))).toBe("/");
  });

  it("rejects short passwords before calling Supabase", async () => {
    const state = await signup(INITIAL_AUTH_STATE, form("kid@example.com", "short"));
    expect(state).toEqual({ error: "weak_password", email: "kid@example.com" });
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it("rejects invalid emails", async () => {
    const state = await signup(INITIAL_AUTH_STATE, form("not-an-email", "carrots123"));
    expect(state.error).toBe("invalid_input");
  });

  it("reports an existing account", async () => {
    mocks.signUp.mockResolvedValue({ data: { user: null, session: null }, error: { code: "user_already_exists" } });
    const state = await signup(INITIAL_AUTH_STATE, form("kid@example.com", "carrots123"));
    expect(state.error).toBe("email_taken");
  });

  it("reports an existing account that Supabase obfuscates", async () => {
    mocks.signUp.mockResolvedValue({ data: { user: { id: "u1", identities: [] }, session: null }, error: null });
    const state = await signup(INITIAL_AUTH_STATE, form("kid@example.com", "carrots123"));
    expect(state.error).toBe("email_taken");
  });

  it("reports Supabase's email rate limit", async () => {
    mocks.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: "over_email_send_rate_limit", status: 429 },
    });
    const state = await signup(INITIAL_AUTH_STATE, form("kid@example.com", "carrots123"));
    expect(state.error).toBe("rate_limited");
  });

  it("does not leak unexpected Supabase errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: "unexpected_failure", message: "db down" },
    });
    const state = await signup(INITIAL_AUTH_STATE, form("kid@example.com", "carrots123"));
    expect(state).toEqual({ error: "signup_failed", email: "kid@example.com" });
  });

  it("reports not_configured without Supabase", async () => {
    mocks.serverConfigured = false;
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

describe("resendConfirmation", () => {
  it("sends the sign-up email again", async () => {
    const data = new FormData();
    data.set("email", "Kid@Example.com");
    const state = await resendConfirmation(INITIAL_AUTH_STATE, data);
    expect(state).toEqual({ error: null, email: "kid@example.com", notice: "resent" });
    expect(mocks.resend).toHaveBeenCalledWith({
      type: "signup",
      email: "kid@example.com",
      options: { emailRedirectTo: CONFIRM_URL },
    });
  });

  it("looks the same whether or not the account exists", async () => {
    mocks.resend.mockResolvedValue({ data: {}, error: { status: 400, code: "user_not_found" } });
    const data = new FormData();
    data.set("email", "nobody@example.com");
    expect((await resendConfirmation(INITIAL_AUTH_STATE, data)).notice).toBe("resent");
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

  it("tells unconfirmed users to check their email", async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: {}, error: { status: 400, code: "email_not_confirmed" } });
    const state = await login(INITIAL_AUTH_STATE, form("kid@example.com", "carrots123"));
    expect(state.error).toBe("email_not_confirmed");
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
