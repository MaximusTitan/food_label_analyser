import { describe, expect, it, vi } from "vitest";

import { buildExample } from "@/lib/examples";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));

const { deleteScan, getScan, toStoredScan } = await import("./scans");

const row = {
  id: "7d5c1b7e-3f7a-4b8e-9a51-2c0f6c1d9e10",
  // Postgres timestamptz as PostgREST returns it: microseconds and an offset.
  created_at: "2026-10-19T10:15:42.123456+00:00",
  source: "example",
  extraction: buildExample("cereal", "en"),
};

describe("toStoredScan", () => {
  it("maps a database row", () => {
    expect(toStoredScan(row)).toEqual({
      id: row.id,
      createdAt: row.created_at,
      source: "example",
      extraction: row.extraction,
    });
  });

  it("drops rows whose JSON doesn't match the schema", () => {
    expect(toStoredScan({ ...row, extraction: { productName: "x" } })).toBeNull();
    expect(toStoredScan({ ...row, source: "admin" })).toBeNull();
  });
});

describe("id validation", () => {
  it("doesn't query the database for malformed ids", async () => {
    expect(await getScan("1 or 1=1")).toBeNull();
    await deleteScan("../etc");
    expect(createClient).not.toHaveBeenCalled();
  });
});
