import type { LabelExtraction, NutritionKey, Tone } from "./schema";

export type Level = "low" | "medium" | "high";
export type Verdict = Tone | "unknown";
export type FactKey = "sugar" | "fat" | "salt" | "fibre" | "calories";

export interface KeyFact {
  key: FactKey;
  /** Amount shown to the user: per serving when printed, else per 100 g/ml. */
  amount: number | null;
  basis: "serving" | "100";
  /** Per 100 g/ml (derived from the serving when only that is printed), for fair comparison. */
  per100: number | null;
  unit: "g" | "kcal";
  level: Level | null;
  tone: Tone | null;
  /** 0–1 bar fill, relative to a little above the "high" threshold. */
  fill: number;
}

export interface Assessment {
  score: number | null;
  verdict: Verdict;
  facts: KeyFact[];
  sugarTeaspoons: number | null;
  transFat: boolean;
  timesPerWeek: number;
}

interface Thresholds {
  low: number;
  high: number;
}

/**
 * UK FSA front-of-pack traffic-light thresholds per 100 g (food) and
 * per 100 ml (drinks). Energy has no FSA band, so it uses an energy-density
 * rule of thumb.
 */
const FOOD: Record<"sugar" | "fat" | "saturatedFat" | "salt" | "energy", Thresholds> = {
  sugar: { low: 5, high: 22.5 },
  fat: { low: 3, high: 17.5 },
  saturatedFat: { low: 1.5, high: 5 },
  salt: { low: 0.3, high: 1.5 },
  energy: { low: 150, high: 400 },
};
const DRINK: typeof FOOD = {
  sugar: { low: 2.5, high: 11.25 },
  fat: { low: 1.5, high: 8.75 },
  saturatedFat: { low: 0.75, high: 2.5 },
  salt: { low: 0.3, high: 0.75 },
  energy: { low: 20, high: 50 },
};
/** EU nutrition-claim levels: "source of fibre" ≥ 3 g, "high fibre" ≥ 6 g. */
const FIBRE = { source: 3, high: 6 };

const GRAMS_PER_TEASPOON_SUGAR = 4;
const TRANS_FAT_TRACE_G = 0.1;

const LEVEL_PENALTY: Record<Level, number> = { low: 0, medium: 1, high: 2 };

function per100(extraction: LabelExtraction, key: NutritionKey): number | null {
  const amount = extraction.nutrition[key];
  if (amount.per100 !== null) return amount.per100;
  const grams = extraction.servingSize.grams;
  if (amount.perServing === null || !grams) return null;
  return (amount.perServing / grams) * 100;
}

function shown(extraction: LabelExtraction, key: NutritionKey) {
  const amount = extraction.nutrition[key];
  if (amount.perServing !== null) return { amount: amount.perServing, basis: "serving" as const };
  return { amount: amount.per100, basis: "100" as const };
}

export function levelFor(value: number | null, t: Thresholds): Level | null {
  if (value === null) return null;
  if (value <= t.low) return "low";
  if (value > t.high) return "high";
  return "medium";
}

function fibreLevel(value: number | null): Level | null {
  if (value === null) return null;
  if (value >= FIBRE.high) return "high";
  if (value >= FIBRE.source) return "medium";
  return "low";
}

const TONE_FOR_LIMIT: Record<Level, Tone> = { low: "good", medium: "moderate", high: "avoid" };
const TONE_FOR_FIBRE: Record<Level, Tone> = { low: "moderate", medium: "good", high: "good" };

function fact(
  extraction: LabelExtraction,
  key: FactKey,
  nutrient: NutritionKey,
  level: Level | null,
  fillMax: number,
): KeyFact {
  const value = per100(extraction, nutrient);
  const toneMap = key === "fibre" ? TONE_FOR_FIBRE : TONE_FOR_LIMIT;
  return {
    key,
    ...shown(extraction, nutrient),
    per100: value === null ? null : Math.round(value * 10) / 10,
    unit: key === "calories" ? "kcal" : "g",
    level,
    tone: level ? toneMap[level] : null,
    fill: value === null ? 0 : Math.min(value / fillMax, 1),
  };
}

export function verdictForScore(score: number | null): Verdict {
  if (score === null) return "unknown";
  if (score >= 7) return "good";
  if (score >= 4) return "moderate";
  return "avoid";
}

const TIMES_PER_WEEK: Record<Verdict, number> = { good: 5, moderate: 2, avoid: 1, unknown: 1 };

/**
 * Deterministic health assessment. The model only reads the label; the score
 * is computed here so it is consistent, explainable and testable.
 */
export function assess(extraction: LabelExtraction): Assessment {
  const t = extraction.isDrink ? DRINK : FOOD;

  const sugar = per100(extraction, "sugarG");
  const fat = per100(extraction, "fatG");
  const saturatedFat = per100(extraction, "saturatedFatG");
  const salt = per100(extraction, "saltG");
  const energy = per100(extraction, "energyKcal");
  const fibre = per100(extraction, "fibreG");
  const transFatValue = per100(extraction, "transFatG");

  const sugarLevel = levelFor(sugar, t.sugar);
  const fatLevel = levelFor(fat, t.fat);
  const satLevel = levelFor(saturatedFat, t.saturatedFat);
  const saltLevel = levelFor(salt, t.salt);
  const energyLevel = levelFor(energy, t.energy);
  const fibreLvl = fibreLevel(fibre);
  const transFat = transFatValue !== null && transFatValue > TRANS_FAT_TRACE_G;

  const facts: KeyFact[] = [
    fact(extraction, "sugar", "sugarG", sugarLevel, t.sugar.high * 1.5),
    fact(extraction, "fat", "fatG", fatLevel, t.fat.high * 1.5),
    fact(extraction, "salt", "saltG", saltLevel, t.salt.high * 1.5),
    fact(extraction, "fibre", "fibreG", fibreLvl, FIBRE.high * 1.5),
    fact(extraction, "calories", "energyKcal", energyLevel, t.energy.high * 1.5),
  ];

  const known = [sugar, fat, saturatedFat, salt, energy, fibre].some((v) => v !== null);
  let score: number | null = null;

  if (known) {
    let points = 10;
    if (sugarLevel) points -= LEVEL_PENALTY[sugarLevel] * 1.5;
    // Saturated fat matters more than total fat; use it when printed.
    const fatForScore = satLevel ?? fatLevel;
    if (fatForScore) points -= LEVEL_PENALTY[fatForScore];
    if (saltLevel) points -= LEVEL_PENALTY[saltLevel];
    if (energyLevel === "high") points -= 1;
    if (transFat) points -= 1.5;
    if (fibreLvl === "high") points += 1;
    else if (fibreLvl === "medium") points += 0.5;

    const flagged = extraction.ingredients.filter((i) => i.tone === "avoid").length;
    points -= Math.min(flagged * 0.5, 1.5);

    // Round down: when in doubt, lean cautious.
    score = Math.min(10, Math.max(1, Math.floor(points)));
  }

  const sugarShown = shown(extraction, "sugarG").amount;
  const verdict = verdictForScore(score);

  return {
    score,
    verdict,
    facts,
    sugarTeaspoons:
      sugarShown === null ? null : Math.round((sugarShown / GRAMS_PER_TEASPOON_SUGAR) * 2) / 2,
    transFat,
    timesPerWeek: TIMES_PER_WEEK[verdict],
  };
}
