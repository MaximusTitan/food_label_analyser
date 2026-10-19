"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  INITIAL_AUTH_STATE,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  type AuthFormState,
} from "@/lib/auth-form";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { login, signup } from "@/lib/server/auth-actions";
import { AlertIcon } from "../icons";

type Mode = "login" | "signup";

const ACTIONS: Record<Mode, (prev: AuthFormState, data: FormData) => Promise<AuthFormState>> = {
  login,
  signup,
};

export function AuthForm({ mode }: { mode: Mode }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(ACTIONS[mode], INITIAL_AUTH_STATE);
  const [showPassword, setShowPassword] = useState(false);
  const isSignup = mode === "signup";

  return (
    <div className="mx-auto w-full max-w-md py-6">
      <div className="mb-6 text-center">
        <p className="text-5xl" aria-hidden="true">
          {isSignup ? "🥕" : "🍎"}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">
          {t(isSignup ? "auth.signupTitle" : "auth.loginTitle")}
        </h1>
        <p className="mt-1 text-ink-muted">{t(isSignup ? "auth.signupSubtitle" : "auth.loginSubtitle")}</p>
      </div>

      <form action={formAction} className="space-y-4 rounded-3xl border-2 border-line bg-surface p-6">
        {state.error && (
          <p role="alert" className="flex items-start gap-2 rounded-2xl border-2 border-avoid bg-avoid-soft p-3 text-sm text-avoid-ink">
            <AlertIcon className="mt-0.5 shrink-0" />
            {t(`auth.error.${state.error}`)}
          </p>
        )}

        <div className="space-y-1">
          <label htmlFor="email" className="block font-semibold">
            {t("auth.email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            defaultValue={state.email}
            key={state.email}
            className="w-full rounded-2xl border-2 border-line bg-surface-2 px-4 py-3 text-ink"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block font-semibold">
            {t("auth.password")}
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={MAX_PASSWORD_LENGTH}
              aria-describedby={isSignup ? "password-hint" : undefined}
              className="w-full rounded-2xl border-2 border-line bg-surface-2 px-4 py-3 pr-20 text-ink"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-2 my-auto h-fit rounded-full px-3 py-1 text-sm font-semibold text-ink-muted hover:bg-surface hover:text-ink"
            >
              {t(showPassword ? "auth.hide" : "auth.show")}
            </button>
          </div>
          {isSignup && (
            <p id="password-hint" className="text-sm text-ink-muted">
              {t("auth.passwordHint", { min: MIN_PASSWORD_LENGTH })}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-brand px-6 py-3 font-display text-lg font-bold text-brand-ink transition-colors hover:bg-brand-strong disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? t("auth.pending") : t(isSignup ? "auth.signupButton" : "auth.loginButton")}
        </button>
      </form>

      <p className="mt-4 text-center text-ink-muted">
        {t(isSignup ? "auth.haveAccount" : "auth.noAccount")}{" "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-bold text-brand hover:underline">
          {t(isSignup ? "auth.loginLink" : "auth.signupLink")}
        </Link>
      </p>
    </div>
  );
}
