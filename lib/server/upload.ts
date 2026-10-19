import { MAX_IMAGE_BYTES, MAX_TEXT_LENGTH, MIN_TEXT_LENGTH } from "@/lib/limits";

export type ImageMediaType = "image/jpeg" | "image/png" | "image/webp";

/**
 * Identifies an image by its magic bytes rather than the client-supplied
 * MIME type, which is trivially spoofed.
 */
export function detectImageType(bytes: Uint8Array): ImageMediaType | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

export type ParsedInput =
  | { kind: "image"; mediaType: ImageMediaType; base64: string }
  | { kind: "text"; text: string };

export type InputError = "missing_input" | "image_too_large" | "unsupported_image" | "text_length";

export async function parseAnalyzeInput(
  form: FormData,
): Promise<{ ok: true; input: ParsedInput } | { ok: false; error: InputError }> {
  const image = form.get("image");
  const text = form.get("text");

  if (image instanceof File && image.size > 0) {
    if (image.size > MAX_IMAGE_BYTES) return { ok: false, error: "image_too_large" };
    const bytes = new Uint8Array(await image.arrayBuffer());
    const mediaType = detectImageType(bytes);
    if (!mediaType) return { ok: false, error: "unsupported_image" };
    return {
      ok: true,
      input: { kind: "image", mediaType, base64: Buffer.from(bytes).toString("base64") },
    };
  }

  if (typeof text === "string") {
    const trimmed = text.trim();
    if (trimmed.length < MIN_TEXT_LENGTH || trimmed.length > MAX_TEXT_LENGTH) {
      return { ok: false, error: "text_length" };
    }
    return { ok: true, input: { kind: "text", text: trimmed } };
  }

  return { ok: false, error: "missing_input" };
}
