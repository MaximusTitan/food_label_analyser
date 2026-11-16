import { describe, expect, it } from "vitest";
import { z } from "zod";

import { modelExtractionSchema } from "./schema";

/** Counts schema nodes that are unions (anyOf/oneOf or a type array), as Claude's structured outputs do. */
function countUnions(node: unknown): number {
  if (Array.isArray(node)) return node.reduce((sum: number, item) => sum + countUnions(item), 0);
  if (!node || typeof node !== "object") return 0;
  const record = node as Record<string, unknown>;
  const self = "anyOf" in record || "oneOf" in record || Array.isArray(record.type) ? 1 : 0;
  return self + Object.values(record).reduce((sum: number, value) => sum + countUnions(value), 0);
}

describe("modelExtractionSchema", () => {
  it("stays under Claude's limit of 16 union-typed parameters", () => {
    expect(countUnions(z.toJSONSchema(modelExtractionSchema))).toBeLessThanOrEqual(16);
  });
});
