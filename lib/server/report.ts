import "server-only";

import { notFound } from "next/navigation";

import type { StoredScan } from "@/lib/analysis/schema";
import { requireUser } from "./auth";
import { getScan } from "./scans";

/** Loads one of the signed-in user's scans, or renders the not-found page. */
export async function loadScan(params: Promise<{ id: string }>): Promise<StoredScan> {
  const { id } = await params;
  await requireUser();
  const scan = await getScan(id);
  if (!scan) notFound();
  return scan;
}
