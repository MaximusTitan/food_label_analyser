import type { KeyFact } from "@/lib/analysis/score";
import type { Locale } from "@/lib/i18n/config";
import type { MessageKey } from "@/lib/i18n/translate";

export function formatAmount(locale: Locale, fact: Pick<KeyFact, "amount" | "unit">): string | null {
  if (fact.amount === null) return null;
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(fact.amount);
  return `${number} ${fact.unit}`;
}

export function basisKey(fact: KeyFact, isDrink: boolean): MessageKey {
  if (fact.basis === "serving") return "fact.perServing";
  return isDrink ? "fact.per100ml" : "fact.per100";
}

export function formatDate(locale: Locale, iso: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
}
