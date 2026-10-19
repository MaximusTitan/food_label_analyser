import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import { Suspense } from "react";

import { AppHeader } from "@/components/AppHeader";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { en } from "@/lib/i18n/messages/en";
import "./globals.css";

const body = Nunito({ variable: "--font-nunito", subsets: ["latin"] });
const display = Baloo_2({ variable: "--font-baloo", subsets: ["latin", "devanagari"] });

export const metadata: Metadata = {
  title: { default: en["app.name"], template: `%s · ${en["app.name"]}` },
  description: en["app.description"],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1612" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">
        <LocaleProvider>
          <AppHeader
            account={
              <Suspense fallback={null}>
                <AccountMenu />
              </Suspense>
            }
          />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-4 sm:px-6">{children}</main>
        </LocaleProvider>
      </body>
    </html>
  );
}
