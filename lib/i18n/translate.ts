import type { Locale } from "./config";
import { en, type MessageKey } from "./messages/en";
import { hi } from "./messages/hi";

export type { MessageKey };
export type TranslateVars = Record<string, string | number>;

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = { en, hi };

export function translate(locale: Locale, key: MessageKey, vars?: TranslateVars): string {
  const template = MESSAGES[locale][key] ?? en[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
