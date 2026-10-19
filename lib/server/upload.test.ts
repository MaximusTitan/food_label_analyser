import { describe, expect, it } from "vitest";

import { MAX_IMAGE_BYTES, MAX_TEXT_LENGTH } from "@/lib/limits";
import { detectImageType, parseAnalyzeInput } from "./upload";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d]);
const WEBP = new TextEncoder().encode("RIFF\u0000\u0000\u0000\u0000WEBPVP8 ");
const GIF = new TextEncoder().encode("GIF89a\u0000\u0000\u0000\u0000\u0000\u0000");

function form(entries: Record<string, string | Blob>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

describe("detectImageType", () => {
  it("recognises JPEG, PNG and WebP by magic bytes", () => {
    expect(detectImageType(JPEG)).toBe("image/jpeg");
    expect(detectImageType(PNG)).toBe("image/png");
    expect(detectImageType(WEBP)).toBe("image/webp");
  });

  it("rejects other formats and short input", () => {
    expect(detectImageType(GIF)).toBeNull();
    expect(detectImageType(new TextEncoder().encode("<svg></svg>"))).toBeNull();
    expect(detectImageType(JPEG.subarray(0, 4))).toBeNull();
  });
});

describe("parseAnalyzeInput", () => {
  it("accepts a JPEG regardless of the declared MIME type", async () => {
    const result = await parseAnalyzeInput(form({ image: new File([JPEG], "x.png", { type: "image/png" }) }));
    expect(result).toEqual({
      ok: true,
      input: { kind: "image", mediaType: "image/jpeg", base64: Buffer.from(JPEG).toString("base64") },
    });
  });

  it("rejects a disguised non-image file", async () => {
    const file = new File(["<script>alert(1)</script>"], "x.jpg", { type: "image/jpeg" });
    expect(await parseAnalyzeInput(form({ image: file }))).toEqual({ ok: false, error: "unsupported_image" });
  });

  it("rejects images over the size limit", async () => {
    const big = new Uint8Array(MAX_IMAGE_BYTES + 1);
    big.set(JPEG);
    expect(await parseAnalyzeInput(form({ image: new File([big], "x.jpg") }))).toEqual({
      ok: false,
      error: "image_too_large",
    });
  });

  it("trims text and enforces its length", async () => {
    expect(await parseAnalyzeInput(form({ text: "  oats, sugar  " }))).toEqual({
      ok: true,
      input: { kind: "text", text: "oats, sugar" },
    });
    expect(await parseAnalyzeInput(form({ text: "  a " }))).toEqual({ ok: false, error: "text_length" });
    expect(await parseAnalyzeInput(form({ text: "a".repeat(MAX_TEXT_LENGTH + 1) }))).toEqual({
      ok: false,
      error: "text_length",
    });
  });

  it("requires some input", async () => {
    expect(await parseAnalyzeInput(new FormData())).toEqual({ ok: false, error: "missing_input" });
  });
});
