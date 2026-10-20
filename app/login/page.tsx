import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth/AuthForm";
import { isAuthErrorCode } from "@/lib/auth-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Suspense fallback={<AuthForm mode="login" />}>
      <LoginForm searchParams={searchParams} />
    </Suspense>
  );
}

/** `?error=` is set by /auth/confirm when a confirmation link has expired or was already used. */
async function LoginForm({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { error } = await searchParams;
  return <AuthForm mode="login" initialError={isAuthErrorCode(error) ? error : null} />;
}
