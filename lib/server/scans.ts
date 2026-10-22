import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { storedScanSchema, type LabelExtraction, type StoredScan } from "@/lib/analysis/schema";
import { createClient } from "@/lib/supabase/server";
import type { ImageMediaType } from "./upload";

export const MAX_SCANS_LISTED = 50;

const PHOTO_BUCKET = "scan-photos";
/** Signed photo links only need to outlive one visit to the report. */
const PHOTO_URL_TTL_S = 60 * 60;

const PHOTO_EXTENSION: Record<ImageMediaType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface ScanPhoto {
  userId: string;
  mediaType: ImageMediaType;
  base64: string;
}

const COLUMNS = "id, created_at, source, extraction";

interface ScanRow {
  id: string;
  created_at: string;
  source: string;
  extraction: unknown;
}

/** Rows are re-validated: the JSON column is only as trustworthy as what was written. */
export function toStoredScan(row: ScanRow): StoredScan | null {
  const parsed = storedScanSchema.safeParse({
    id: row.id,
    createdAt: row.created_at,
    source: row.source,
    extraction: row.extraction,
  });
  return parsed.success ? parsed.data : null;
}

async function client(): Promise<SupabaseClient> {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

// All queries run as the signed-in user, so Row Level Security limits them to
// that user's rows.

export async function listScans(): Promise<StoredScan[]> {
  const { data, error } = await (await client())
    .from("scans")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(MAX_SCANS_LISTED);
  if (error) throw new Error("Could not load scans");
  return (data ?? []).flatMap((row) => toStoredScan(row) ?? []);
}

export async function getScan(id: string): Promise<StoredScan | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const { data, error } = await (await client())
    .from("scans")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Could not load scan");
  return data ? toStoredScan(data) : null;
}

/** Short-lived link to a scan's label photo, or null when it has none. */
export async function getScanPhotoUrl(id: string): Promise<string | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = await client();
  const { data } = await supabase.from("scans").select("image_path").eq("id", id).maybeSingle();
  if (!data?.image_path) return null;
  const { data: signed } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(data.image_path as string, PHOTO_URL_TTL_S);
  return signed?.signedUrl ?? null;
}

/**
 * Saves a scan, and its label photo when there is one. The photo is stored
 * under the user's own folder; if that upload fails the scan is still saved
 * without it, since the analysis is what matters.
 */
export async function insertScan(
  extraction: LabelExtraction,
  source: StoredScan["source"],
  photo?: ScanPhoto,
): Promise<string> {
  const supabase = await client();
  const id = crypto.randomUUID();

  let imagePath: string | null = null;
  if (photo) {
    const path = `${photo.userId}/${id}.${PHOTO_EXTENSION[photo.mediaType]}`;
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, Buffer.from(photo.base64, "base64"), { contentType: photo.mediaType });
    if (error) console.error("scans: photo upload failed", error.name);
    else imagePath = path;
  }

  const { error } = await supabase.from("scans").insert({ id, source, extraction, image_path: imagePath });
  if (error) {
    if (imagePath) await supabase.storage.from(PHOTO_BUCKET).remove([imagePath]);
    throw new Error("Could not save scan");
  }
  return id;
}

export async function deleteScan(id: string): Promise<void> {
  if (!z.uuid().safeParse(id).success) return;
  const supabase = await client();
  const { data, error } = await supabase
    .from("scans")
    .delete()
    .eq("id", id)
    .select("image_path")
    .maybeSingle();
  if (error) throw new Error("Could not delete scan");
  if (data?.image_path) {
    const { error: removeError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .remove([data.image_path as string]);
    if (removeError) console.error("scans: photo delete failed", removeError.name);
  }
}
