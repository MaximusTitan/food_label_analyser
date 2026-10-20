"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { LOCALES, isLocale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/LocaleProvider";

/** `account` is server-rendered (it reads the session) and streams in. */
export function AppHeader({ account }: { account: ReactNode }) {
  const { t, locale, setLocale } = useI18n();

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 font-display text-lg leading-tight font-bold text-logo-ink sm:text-xl"
        >
          <Image src="/logo-mark.png" alt="" width={274} height={469} priority className="h-9 w-auto shrink-0" />
          {/* Phones only have room for the mark next to the account links. */}
          <span className="max-sm:sr-only">{t("app.name")}</span>
        </Link>
        <nav className="ml-auto flex shrink-0 items-center gap-1 whitespace-nowrap text-sm sm:gap-2">
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
