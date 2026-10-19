import { z } from "zod";

export const ALLERGENS = [
  "milk",
  "eggs",
  "peanuts",
  "tree_nuts",
  "soy",
  "gluten",
  "fish",
  "shellfish",
  "sesame",
  "mustard",
  "celery",
  "sulphites",
  "lupin",
] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const INGREDIENT_TAGS = [
  "whole_food",
  "sugar",
  "fat",
  "salt",
  "additive",
  "allergen",
] as const;
export type IngredientTag = (typeof INGREDIENT_TAGS)[number];

export const TONES = ["good", "moderate", "avoid"] as const;
export type Tone = (typeof TONES)[number];

/** A nutrient amount as printed on the label. Either column may be missing. */
const amountSchema = z.object({
  per100: z.number().nullable(),
  perServing: z.number().nullable(),
});
export type Amount = z.infer<typeof amountSchema>;

/**
 * What the model extracts from a label. Kept free of numeric/length
 * constraints because structured outputs only support a JSON Schema subset;
 * `normalizeExtraction` enforces bounds afterwards.
 */
export const labelExtractionSchema = z.object({
  isFoodLabel: z.boolean(),
  productName: z.string(),
  isDrink: z.boolean(),
  servingSize: z.object({
    description: z.string(),
    grams: z.number().nullable(),
  }),
  nutrition: z.object({
    energyKcal: amountSchema,
    sugarG: amountSchema,
    fatG: amountSchema,
    saturatedFatG: amountSchema,
    transFatG: amountSchema,
    saltG: amountSchema,
    sodiumMg: amountSchema,
    fibreG: amountSchema,
    proteinG: amountSchema,
  }),
  ingredients: z.array(
    z.object({
      name: z.string(),
      eNumber: z.string().nullable(),
      tags: z.array(z.enum(INGREDIENT_TAGS)),
      tone: z.enum(TONES),
      explanation: z.string(),
    }),
  ),
  allergens: z.array(z.enum(ALLERGENS)),
  mayContain: z.array(z.enum(ALLERGENS)),
  summary: z.string(),
  benefits: z.array(z.string()),
  risks: z.array(z.string()),
  whoShouldSkip: z.array(z.string()),
  healthierSwaps: z.array(z.string()),
});
export type LabelExtraction = z.infer<typeof labelExtractionSchema>;
export type NutritionKey = keyof LabelExtraction["nutrition"];

export const SCAN_SOURCES = ["photo", "text", "example"] as const;

export const storedScanSchema = z.object({
  id: z.uuid(),
  createdAt: z.iso.datetime({ offset: true }),
  source: z.enum(SCAN_SOURCES),
  extraction: labelExtractionSchema,
});
export type StoredScan = z.infer<typeof storedScanSchema>;
