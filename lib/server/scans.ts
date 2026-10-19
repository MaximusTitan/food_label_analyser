import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { storedScanSchema, type LabelExtraction, type StoredScan } from "@/lib/analysis/schema";
import { createClient } from "@/lib/supabase/server";

export const MAX_SCANS_LISTED = 50;

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

export async function insertScan(
  extraction: LabelExtraction,
  source: StoredScan["source"],
): Promise<string> {
  const { data, error } = await (await client())
    .from("scans")
    .insert({ source, extraction })
    .select("id")
    .single();
  if (error || !data) throw new Error("Could not save scan");
  return data.id as string;
}

export async function deleteScan(id: string): Promise<void> {
  if (!z.uuid().safeParse(id).success) return;
  const { error } = await (await client()).from("scans").delete().eq("id", id);
  if (error) throw new Error("Could not delete scan");
}
