import { describe, expect, it } from "vitest";

import { isValidSupabaseUrl } from "./env";

describe("isValidSupabaseUrl", () => {
  it("accepts project origins", () => {
    expect(isValidSupabaseUrl("https://abcdefghijklmnop.supabase.co")).toBe(true);
    expect(isValidSupabaseUrl("https://abcdefghijklmnop.supabase.co/")).toBe(true);
    expect(isValidSupabaseUrl("http://127.0.0.1:54321")).toBe(true);
  });

  it("rejects a URL pasted twice", () => {
    expect(isValidSupabaseUrl("https://abc.supabase.cohttps://abc.supabase.co")).toBe(false);
  });

  it("rejects paths, plain http and junk", () => {
    expect(isValidSupabaseUrl("https://abc.supabase.co/rest/v1")).toBe(false);
    expect(isValidSupabaseUrl("http://abc.supabase.co")).toBe(false);
    expect(isValidSupabaseUrl("abc.supabase.co")).toBe(false);
  });
});
