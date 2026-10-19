"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { EXAMPLE_IDS, buildExample } from "@/lib/examples";
import { LOCALES } from "@/lib/i18n/config";
import { requireUser } from "./auth";
import { deleteScan, insertScan } from "./scans";

// Server Actions are public endpoints: validate every argument.
const exampleInput = z.object({ id: z.enum(EXAMPLE_IDS), locale: z.enum(LOCALES) });

export async function openExample(id: unknown, locale: unknown): Promise<void> {
  const input = exampleInput.safeParse({ id, locale });
  if (!input.success) return;
  await requireUser();
  const scanId = await insertScan(buildExample(input.data.id, input.data.locale), "example");
  redirect(`/report/${scanId}`);
}

export async function removeScan(id: unknown): Promise<void> {
  const scanId = z.uuid().safeParse(id);
  if (!scanId.success) return;
  await requireUser();
  await deleteScan(scanId.data);
  refresh();
}
