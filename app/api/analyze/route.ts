import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { AnalyzeFailure, analyzeLabel, type AnalyzeError } from "@/lib/server/analyze";
import { getCurrentUser } from "@/lib/server/auth";
import { createRateLimiter } from "@/lib/server/rate-limit";
import { MAX_IMAGE_BYTES } from "@/lib/limits";
import { insertScan } from "@/lib/server/scans";
import { parseAnalyzeInput } from "@/lib/server/upload";

/** Room for the image plus multipart framing and the other fields. */
const MAX_BODY_BYTES = MAX_IMAGE_BYTES + 64 * 1024;

const checkRate = createRateLimiter({ limit: 10, windowMs: 60_000 });

const STATUS: Record<AnalyzeError, number> = {
  not_configured: 503,
  refused: 422,
  unreadable: 422,
  not_a_label: 422,
  upstream: 502,
};

function fail(error: string, status: number, headers?: HeadersInit) {
  return Response.json({ error }, { status, headers });
}

export async function POST(request: Request) {
  // Only this app's own pages may call this route.
  if (request.headers.get("sec-fetch-site") === "cross-site") return fail("forbidden", 403);

  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) return fail("image_too_large", 413);

  // Only signed-in users may spend the model quota.
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized", 401);

  const rate = checkRate(user.id);
  if (!rate.allowed) {
    return fail("rate_limited", 429, { "Retry-After": String(rate.retryAfterS) });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("missing_input", 400);
  }

  const parsed = await parseAnalyzeInput(form);
  if (!parsed.ok) return fail(parsed.error, parsed.error === "image_too_large" ? 413 : 400);

  const locale = form.get("locale");

  try {
    const extraction = await analyzeLabel(parsed.input, isLocale(locale) ? locale : DEFAULT_LOCALE);
    const id = await insertScan(extraction, parsed.input.kind === "image" ? "photo" : "text");
    return Response.json({ id });
  } catch (error) {
    if (error instanceof AnalyzeFailure) return fail(error.code, STATUS[error.code]);
    console.error("analyze: unexpected failure", error instanceof Error ? error.name : "unknown");
    return fail("upstream", 500);
  }
}
