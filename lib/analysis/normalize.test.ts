import { describe, expect, it } from "vitest";

import { buildExample } from "@/lib/examples";
import { normalizeExtraction } from "./normalize";
import type { LabelExtraction } from "./schema";

function sample(): LabelExtraction {
  return buildExample("cereal", "en");
}

describe("normalizeExtraction", () => {
  it("leaves clean input unchanged", () => {
    expect(normalizeExtraction(sample())).toEqual(sample());
  });

  it("drops impossible and non-finite numbers", () => {
    const raw = sample();
    raw.nutrition.sugarG = { per100: 250, perServing: -3 };
    raw.nutrition.fatG = { per100: Number.NaN, perServing: Number.POSITIVE_INFINITY };
    const out = normalizeExtraction(raw);
    expect(out.nutrition.sugarG).toEqual({ per100: null, perServing: null });
    expect(out.nutrition.fatG).toEqual({ per100: null, perServing: null });
  });

  it("derives salt from sodium when salt is not printed", () => {
    const raw = sample();
    raw.nutrition.saltG = { per100: null, perServing: null };
    raw.nutrition.sodiumMg = { per100: 400, perServing: 120 };
    const out = normalizeExtraction(raw);
    expect(out.nutrition.saltG).toEqual({ per100: 1, perServing: 0.3 });
  });

  it("prefers printed salt over sodium", () => {
    const raw = sample();
    raw.nutrition.saltG = { per100: 0.5, perServing: null };
    raw.nutrition.sodiumMg = { per100: 400, perServing: null };
    expect(normalizeExtraction(raw).nutrition.saltG.per100).toBe(0.5);
  });

  it("trims long text and caps list lengths", () => {
    const raw = sample();
    raw.productName = `  ${"A".repeat(200)}  `;
    raw.risks = Array.from({ length: 12 }, (_, i) => `risk ${i}`);
    raw.healthierSwaps = ["Oats", "oats", "Fruit", "Nuts", "Yoghurt"];
    const out = normalizeExtraction(raw);
    expect(out.productName.length).toBeLessThanOrEqual(80);
    expect(out.productName.endsWith("…")).toBe(true);
    expect(out.risks).toHaveLength(5);
    expect(out.healthierSwaps).toEqual(["Oats", "Fruit", "Nuts"]);
  });

  it("removes duplicate allergens and those already in contains", () => {
    const raw = sample();
    raw.allergens = ["milk", "milk", "soy"];
    raw.mayContain = ["milk", "gluten", "gluten"];
    const out = normalizeExtraction(raw);
    expect(out.allergens).toEqual(["milk", "soy"]);
    expect(out.mayContain).toEqual(["gluten"]);
  });

  it("drops ingredients with blank names", () => {
    const raw = sample();
    raw.ingredients.push({ name: "   ", eNumber: null, tags: [], tone: "good", explanation: "" });
    expect(normalizeExtraction(raw).ingredients).toHaveLength(sample().ingredients.length);
  });
});
