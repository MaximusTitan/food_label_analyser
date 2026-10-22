import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildExample } from "@/lib/examples";

const { generateText } = vi.hoisted(() => ({ generateText: vi.fn() }));

vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ai")>()),
  generateText,
}));

const { NoObjectGeneratedError } = await import("ai");
const { AnalyzeFailure, analyzeLabel } = await import("./analyze");

const TEXT = { kind: "text", text: "oats, sugar" } as const;

async function failureCode(promise: Promise<unknown>) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(AnalyzeFailure);
  return (error as InstanceType<typeof AnalyzeFailure>).code;
}

describe("analyzeLabel", () => {
  beforeEach(() => {
    generateText.mockReset();
    vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
    vi.stubEnv("VERCEL_OIDC_TOKEN", "");
    vi.stubEnv("AI_MODEL", "");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("calls the gateway with the default model and returns normalised output", async () => {
    generateText.mockResolvedValue({ finishReason: "stop", output: buildExample("cereal", "en") });
    const result = await analyzeLabel(TEXT, "hi");

    expect(result.productName).toBe("Choco Crunch Cereal");
    const call = generateText.mock.calls[0][0];
    expect(call.model.modelId).toBe("anthropic/claude-sonnet-5.5");
    expect(call.system).toContain("in Hindi");
    expect(call.messages[0].content[0].text).toContain("<label_text>\noats, sugar\n</label_text>");
  });

  it("lets AI_MODEL pick another gateway model", async () => {
    vi.stubEnv("AI_MODEL", "anthropic/claude-opus-5.5");
    generateText.mockResolvedValue({ finishReason: "stop", output: buildExample("juice", "en") });
    await analyzeLabel(TEXT, "en");
    expect(generateText.mock.calls[0][0].model.modelId).toBe("anthropic/claude-opus-5.5");
  });

  it("sends photos as image file parts", async () => {
    generateText.mockResolvedValue({ finishReason: "stop", output: buildExample("juice", "en") });
    await analyzeLabel({ kind: "image", mediaType: "image/png", base64: "AAAA" }, "en");
    expect(generateText.mock.calls[0][0].messages[0].content[0]).toEqual({
      type: "file",
      mediaType: "image/png",
      data: "AAAA",
    });
  });

  it("reports not_configured without gateway credentials", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "");
    expect(await failureCode(analyzeLabel(TEXT, "en"))).toBe("not_configured");
    expect(generateText).not.toHaveBeenCalled();
  });

  it("maps a content filter stop to refused", async () => {
    generateText.mockResolvedValue({ finishReason: "content-filter", output: buildExample("juice", "en") });
    expect(await failureCode(analyzeLabel(TEXT, "en"))).toBe("refused");
  });

  it("maps unparseable model output to unreadable", async () => {
    generateText.mockImplementation(async () => {
      throw new NoObjectGeneratedError({
        message: "bad json",
        text: "{",
        response: { id: "1", timestamp: new Date(), modelId: "m" },
        usage: {
          inputTokens: 1,
          outputTokens: 1,
          totalTokens: 2,
          inputTokenDetails: { noCacheTokens: 1, cacheReadTokens: 0, cacheWriteTokens: 0 },
          outputTokenDetails: { textTokens: 1, reasoningTokens: 0 },
        },
        finishReason: "stop",
      });
    });
    expect(await failureCode(analyzeLabel(TEXT, "en"))).toBe("unreadable");
  });

  it("rejects things that are not food labels", async () => {
    generateText.mockResolvedValue({
      finishReason: "stop",
      output: { ...buildExample("juice", "en"), isFoodLabel: false },
    });
    expect(await failureCode(analyzeLabel(TEXT, "en"))).toBe("not_a_label");
  });
});
