"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";

import { createLocalStore } from "@/lib/client/local-store";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";
import { translate, type MessageKey, type TranslateVars } from "./translate";

const localeStore = createLocalStore<Locale>(
  "snackcheck.locale",
  (raw) => {
    try {
      const value: unknown = raw ? JSON.parse(raw) : null;
      return isLocale(value) ? value : DEFAULT_LOCALE;
    } catch {
      return DEFAULT_LOCALE;
    }
  },
  DEFAULT_LOCALE,
);

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: TranslateVars) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = localeStore.useValue();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key: MessageKey, vars?: TranslateVars) => translate(locale, key, vars),
    [locale],
  );
  const value = useMemo(() => ({ locale, setLocale: localeStore.set, t }), [locale, t]);

  return <LocaleContext value={value}>{children}</LocaleContext>;
}

export function useI18n(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useI18n must be used inside LocaleProvider");
  return value;
}
