import { z } from "zod";

import type { Locale } from "@/lib/i18n/config";

/** Claude downsamples anything larger, so there's no point uploading more. */
const MAX_EDGE_PX = 1568;
const JPEG_QUALITY = 0.85;

export const ERROR_CODES = [
  "not_configured",
  "refused",
  "unreadable",
  "not_a_label",
  "upstream",
  "rate_limited",
  "image_too_large",
  "unsupported_image",
  "text_length",
  "missing_input",
  "forbidden",
  "network",
  "unauthorized",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export class AnalyzeRequestError extends Error {
  constructor(public readonly code: ErrorCode) {
    super(code);
  }
}

function toErrorCode(value: unknown): ErrorCode {
  return (ERROR_CODES as readonly unknown[]).includes(value) ? (value as ErrorCode) : "upstream";
}

/** Re-encodes a photo as a JPEG no larger than MAX_EDGE_PX on its long side. */
export async function prepareImage(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new AnalyzeRequestError("unsupported_image");
  }
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) throw new AnalyzeRequestError("unsupported_image");
  return blob;
}

export async function requestAnalysis(
  input: { image: Blob } | { text: string },
  locale: Locale,
  signal: AbortSignal,
): Promise<string> {
  const body = new FormData();
  if ("image" in input) body.set("image", input.image, "label.jpg");
  else body.set("text", input.text);
  body.set("locale", locale);

  let response: Response;
  try {
    response = await fetch("/api/analyze", { method: "POST", body, signal });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new AnalyzeRequestError("network");
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code = data && typeof data === "object" && "error" in data ? data.error : null;
    throw new AnalyzeRequestError(toErrorCode(code));
  }

  // The route saves the scan and returns its id.
  const id = z.object({ id: z.uuid() }).safeParse(data);
  if (!id.success) throw new AnalyzeRequestError("upstream");
  return id.data.id;
}
