import type { Amount, LabelExtraction, NutritionKey } from "./schema";

const MAX_TEXT = 240;
const MAX_NAME = 80;
const MAX_INGREDIENTS = 40;
const MAX_LIST = 5;

/** Upper bounds per 100 g / serving; anything above is a misread. */
const NUTRIENT_LIMITS: Record<NutritionKey, number> = {
  energyKcal: 1000,
  sugarG: 100,
  fatG: 100,
  saturatedFatG: 100,
  transFatG: 100,
  saltG: 100,
  sodiumMg: 40000,
  fibreG: 100,
  proteinG: 100,
};

/** Salt (g) = sodium (g) × 2.5. */
const SALT_PER_SODIUM_MG = 2.5 / 1000;

function cleanText(value: string, max: number): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length > max ? `${collapsed.slice(0, max - 1).trimEnd()}…` : collapsed;
}

function cleanList(values: string[], max = MAX_LIST): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const text = cleanText(value, MAX_TEXT);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length === max) break;
  }
  return out;
}

function cleanNumber(value: number | null, limit: number): number | null {
  if (value === null || !Number.isFinite(value) || value < 0 || value > limit) {
    return null;
  }
  return Math.round(value * 10) / 10;
}

function cleanAmount(amount: Amount, limit: number): Amount {
  return {
    per100: cleanNumber(amount.per100, limit),
    perServing: cleanNumber(amount.perServing, limit),
  };
}

function saltFromSodium(sodium: number | null): number | null {
  return sodium === null ? null : Math.round(sodium * SALT_PER_SODIUM_MG * 100) / 100;
}

/**
 * Bounds and tidies model output so the UI and scoring can trust it:
 * drops impossible numbers, trims long text, dedupes lists and derives salt
 * from sodium when only sodium is printed.
 */
export function normalizeExtraction(raw: LabelExtraction): LabelExtraction {
  const nutrition = Object.fromEntries(
    (Object.keys(NUTRIENT_LIMITS) as NutritionKey[]).map((key) => [
      key,
      cleanAmount(raw.nutrition[key], NUTRIENT_LIMITS[key]),
    ]),
  ) as LabelExtraction["nutrition"];

  nutrition.saltG = {
    per100: nutrition.saltG.per100 ?? saltFromSodium(nutrition.sodiumMg.per100),
    perServing: nutrition.saltG.perServing ?? saltFromSodium(nutrition.sodiumMg.perServing),
  };

  const allergens = [...new Set(raw.allergens)];

  return {
    isFoodLabel: raw.isFoodLabel,
    productName: cleanText(raw.productName, MAX_NAME),
    isDrink: raw.isDrink,
    servingSize: {
      description: cleanText(raw.servingSize.description, MAX_NAME),
      grams: cleanNumber(raw.servingSize.grams, 2000),
    },
    nutrition,
    ingredients: raw.ingredients
      .map((ingredient) => ({
        name: cleanText(ingredient.name, MAX_NAME),
        eNumber: ingredient.eNumber ? cleanText(ingredient.eNumber, 12) : null,
        tags: [...new Set(ingredient.tags)],
        tone: ingredient.tone,
        explanation: cleanText(ingredient.explanation, MAX_TEXT),
      }))
      .filter((ingredient) => ingredient.name.length > 0)
      .slice(0, MAX_INGREDIENTS),
    allergens,
    mayContain: [...new Set(raw.mayContain)].filter((a) => !allergens.includes(a)),
    summary: cleanText(raw.summary, MAX_TEXT * 2),
    benefits: cleanList(raw.benefits),
    risks: cleanList(raw.risks),
    whoShouldSkip: cleanList(raw.whoShouldSkip),
    healthierSwaps: cleanList(raw.healthierSwaps, 3),
  };
}
