import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildExample } from "@/lib/examples";

const { analyzeLabel, AnalyzeFailure, getCurrentUser, insertScan } = vi.hoisted(() => {
  class AnalyzeFailure extends Error {
    constructor(public readonly code: string) {
      super(code);
    }
  }
  return { analyzeLabel: vi.fn(), AnalyzeFailure, getCurrentUser: vi.fn(), insertScan: vi.fn() };
});

vi.mock("@/lib/server/analyze", () => ({ AnalyzeFailure, analyzeLabel }));
vi.mock("@/lib/server/auth", () => ({ getCurrentUser }));
vi.mock("@/lib/server/scans", () => ({ insertScan }));

const SCAN_ID = "7d5c1b7e-3f7a-4b8e-9a51-2c0f6c1d9e10";

const { POST } = await import("./route");

let userCount = 0;

function post(body: FormData, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/analyze", { method: "POST", body, headers });
}

function textForm(text = "oats, sugar, salt", locale = "hi") {
  const form = new FormData();
  form.set("text", text);
  form.set("locale", locale);
  return form;
}

describe("POST /api/analyze", () => {
  beforeEach(() => {
    analyzeLabel.mockReset();
    insertScan.mockReset().mockResolvedValue(SCAN_ID);
    // A fresh user per test keeps the per-user rate limiter out of the way.
    userCount += 1;
    getCurrentUser.mockReset().mockResolvedValue({ id: `user-${userCount}`, email: null });
  });

  it("saves the extraction and returns the new scan id", async () => {
    const extraction = buildExample("cereal", "hi");
    analyzeLabel.mockResolvedValue(extraction);

    const res = await POST(post(textForm()));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: SCAN_ID });
    expect(analyzeLabel).toHaveBeenCalledWith({ kind: "text", text: "oats, sugar, salt" }, "hi");
    expect(insertScan).toHaveBeenCalledWith(extraction, "text");
  });

  it("requires a signed-in user", async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await POST(post(textForm()));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
    expect(analyzeLabel).not.toHaveBeenCalled();
  });

  it("falls back to English for unknown locales", async () => {
    analyzeLabel.mockResolvedValue(buildExample("cereal", "en"));
    await POST(post(textForm(undefined, "xx")));
    expect(analyzeLabel.mock.calls[0][1]).toBe("en");
  });

  it("rejects cross-site requests", async () => {
    const res = await POST(post(textForm(), { "sec-fetch-site": "cross-site" }));
    expect(res.status).toBe(403);
    expect(analyzeLabel).not.toHaveBeenCalled();
  });

  it("rejects oversized bodies before reading them", async () => {
    const res = await POST(post(textForm(), { "content-length": String(50 * 1024 * 1024) }));
    expect(res.status).toBe(413);
  });

  it("validates input", async () => {
    const res = await POST(post(textForm("a")));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "text_length" });
  });

  it("maps analysis failures to safe error codes", async () => {
    analyzeLabel.mockImplementation(async () => {
      throw new AnalyzeFailure("not_a_label");
    });
    const res = await POST(post(textForm()));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "not_a_label" });
  });

  it("hides unexpected errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    analyzeLabel.mockImplementation(async () => {
      throw new Error("secret internal detail");
    });
    const res = await POST(post(textForm()));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "upstream" });
  });

  it("rate limits each user, whatever their IP", async () => {
    analyzeLabel.mockResolvedValue(buildExample("cereal", "en"));
    let ip = 0;
    const send = () => {
      ip += 1;
      return POST(post(textForm(), { "x-forwarded-for": `192.0.2.${ip}` }));
    };
    for (let i = 0; i < 10; i += 1) expect((await send()).status).toBe(200);
    const blocked = await send();
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
  });
});
