import { describe, expect, it } from "vitest";

import { buildExample } from "@/lib/examples";
import type { LabelExtraction } from "./schema";
import { assess, levelFor, verdictForScore } from "./score";

const empty = { per100: null, perServing: null };

function label(overrides: Partial<LabelExtraction> = {}): LabelExtraction {
  return {
    isFoodLabel: true,
    productName: "Test",
    isDrink: false,
    servingSize: { description: "", grams: null },
    nutrition: {
      energyKcal: empty,
      sugarG: empty,
      fatG: empty,
      saturatedFatG: empty,
      transFatG: empty,
      saltG: empty,
      sodiumMg: empty,
      fibreG: empty,
      proteinG: empty,
    },
    ingredients: [],
    allergens: [],
    mayContain: [],
    summary: "",
    benefits: [],
    risks: [],
    whoShouldSkip: [],
    healthierSwaps: [],
    ...overrides,
  };
}

function withNutrition(n: Partial<LabelExtraction["nutrition"]>, extra: Partial<LabelExtraction> = {}) {
  const base = label(extra);
  return { ...base, nutrition: { ...base.nutrition, ...n } };
}

describe("levelFor", () => {
  const t = { low: 5, high: 22.5 };
  it("treats the low threshold as low and anything above high as high", () => {
    expect(levelFor(5, t)).toBe("low");
    expect(levelFor(5.1, t)).toBe("medium");
    expect(levelFor(22.5, t)).toBe("medium");
    expect(levelFor(22.6, t)).toBe("high");
    expect(levelFor(null, t)).toBeNull();
  });
});

describe("verdictForScore", () => {
  it("maps score bands to verdicts", () => {
    expect(verdictForScore(10)).toBe("good");
    expect(verdictForScore(7)).toBe("good");
    expect(verdictForScore(6)).toBe("moderate");
    expect(verdictForScore(4)).toBe("moderate");
    expect(verdictForScore(3)).toBe("avoid");
    expect(verdictForScore(null)).toBe("unknown");
  });
});

describe("assess", () => {
  it("returns no score when no nutrition is printed", () => {
    const result = assess(label());
    expect(result.score).toBeNull();
    expect(result.verdict).toBe("unknown");
    expect(result.facts.every((f) => f.level === null)).toBe(true);
  });

  it("scores a low-sugar, high-fibre food as good", () => {
    const result = assess(
      withNutrition({
        sugarG: { per100: 1, perServing: null },
        fatG: { per100: 2, perServing: null },
        saltG: { per100: 0.1, perServing: null },
        fibreG: { per100: 8, perServing: null },
        energyKcal: { per100: 120, perServing: null },
      }),
    );
    expect(result.score).toBe(10);
    expect(result.verdict).toBe("good");
  });

  it("penalises a high-sugar, high-fat, high-energy food", () => {
    const result = assess(
      withNutrition({
        sugarG: { per100: 56, perServing: null },
        saturatedFatG: { per100: 18, perServing: null },
        saltG: { per100: 0.2, perServing: null },
        energyKcal: { per100: 540, perServing: null },
      }),
    );
    expect(result.score).toBe(4);
    expect(result.verdict).toBe("moderate");
  });

  it("uses drink thresholds for drinks", () => {
    const sugar = { sugarG: { per100: 12, perServing: null } };
    expect(assess(withNutrition(sugar)).facts[0].level).toBe("medium");
    expect(assess(withNutrition(sugar, { isDrink: true })).facts[0].level).toBe("high");
  });

  it("derives per-100 g values from the serving when only that is printed", () => {
    const result = assess(
      withNutrition(
        { sugarG: { per100: null, perServing: 12 } },
        { servingSize: { description: "1 bowl", grams: 30 } },
      ),
    );
    const sugar = result.facts.find((f) => f.key === "sugar")!;
    expect(sugar.per100).toBe(40);
    expect(sugar.amount).toBe(12);
    expect(sugar.basis).toBe("serving");
    expect(sugar.level).toBe("high");
    expect(result.sugarTeaspoons).toBe(3);
  });

  it("flags trans fat above trace amounts and lowers the score", () => {
    const base = { sugarG: { per100: 1, perServing: null } };
    const clean = assess(withNutrition(base));
    const trans = assess(withNutrition({ ...base, transFatG: { per100: 1.2, perServing: null } }));
    expect(trans.transFat).toBe(true);
    expect(trans.score!).toBeLessThan(clean.score!);
    expect(assess(withNutrition({ ...base, transFatG: { per100: 0.05, perServing: null } })).transFat).toBe(false);
  });

  it("caps the penalty for flagged ingredients", () => {
    const flagged = Array.from({ length: 10 }, (_, i) => ({
      name: `E${i}`,
      eNumber: null,
      tags: ["additive" as const],
      tone: "avoid" as const,
      explanation: "",
    }));
    const result = assess(withNutrition({ sugarG: { per100: 1, perServing: null } }, { ingredients: flagged }));
    expect(result.score).toBe(8);
  });

  it("keeps the score between 1 and 10", () => {
    const result = assess(
      withNutrition({
        sugarG: { per100: 90, perServing: null },
        saturatedFatG: { per100: 40, perServing: null },
        saltG: { per100: 5, perServing: null },
        energyKcal: { per100: 900, perServing: null },
        transFatG: { per100: 5, perServing: null },
      }),
    );
    expect(result.score).toBe(1);
    expect(result.verdict).toBe("avoid");
  });

  it("gives the bundled examples sensible verdicts", () => {
    expect(assess(buildExample("cereal", "en")).verdict).toBe("moderate");
    expect(assess(buildExample("chocolate", "en")).verdict).toBe("avoid");
    expect(assess(buildExample("juice", "en")).verdict).toBe("moderate");
    expect(assess(buildExample("biscuits", "en")).verdict).toBe("moderate");
  });
});
