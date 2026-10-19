"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { LOCALES, isLocale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { SearchIcon } from "./icons";

/** `account` is server-rendered (it reads the session) and streams in. */
export function AppHeader({ account }: { account: ReactNode }) {
  const { t, locale, setLocale } = useI18n();

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-xl font-bold text-brand"
        >
          <SearchIcon className="text-2xl" />
          {t("app.name")}
        </Link>
        <nav className="ml-auto flex items-center gap-2 text-sm">
          {account}
          <label className="sr-only" htmlFor="language">
            {t("nav.language")}
          </label>
          <select
            id="language"
            value={locale}
            onChange={(event) => {
              if (isLocale(event.target.value)) setLocale(event.target.value);
            }}
            className="rounded-full border border-line bg-surface px-3 py-2 font-semibold text-ink"
          >
            {LOCALES.map((value) => (
              <option key={value} value={value}>
                {t(`lang.${value}`)}
              </option>
            ))}
          </select>
        </nav>
      </div>
    </header>
  );
}
