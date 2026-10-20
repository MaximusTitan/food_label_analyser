"use client";

import Link from "next/link";

import { useI18n } from "@/lib/i18n/LocaleProvider";
import { logout } from "@/lib/server/auth-actions";

const LINK =
  "rounded-full px-2 py-2 font-semibold sm:px-3 text-ink-muted hover:bg-surface-2 hover:text-ink";

/** `email` is null when signed out. */
export function AccountLinks({ email }: { email: string | null }) {
  const { t } = useI18n();

  if (email === null) {
    return (
      <>
        <Link href="/login" className={LINK}>
          {t("auth.loginLink")}
        </Link>
        <Link
          href="/signup"
          className="rounded-full bg-brand px-3 py-2 sm:px-4 font-semibold text-brand-ink hover:bg-brand-strong"
        >
          {t("auth.signupLink")}
        </Link>
      </>
    );
  }

  return (
    <>
      <Link href="/history" className={LINK}>
        {t("nav.myScans")}
      </Link>
      <form action={logout} className="flex items-center">
        <button type="submit" className={LINK} title={email || undefined}>
          {t("auth.logout")}
        </button>
      </form>
    </>
  );
}
