"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";

import type { StoredScan } from "@/lib/analysis/schema";
import { assess, type Assessment } from "@/lib/analysis/score";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { ChevronLeftIcon } from "../icons";

export interface ReportData {
  scan: StoredScan;
  assessment: Assessment;
}

interface Props {
  scan: StoredScan;
  backHref: string;
  children: (data: ReportData) => ReactNode;
}

export function ReportFrame({ scan, backHref, children }: Props) {
  const { t } = useI18n();
  const assessment = useMemo(() => assess(scan.extraction), [scan]);

  return (
    <div className="space-y-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 rounded-full py-1 pr-3 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ChevronLeftIcon /> {t("report.back")}
      </Link>
      {children({ scan, assessment })}
    </div>
  );
}

export function ReportSkeleton() {
  return (
    <div className="animate-pulse space-y-4 py-4" aria-busy="true">
      <div className="h-5 w-16 rounded bg-surface-2" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-80 rounded-3xl bg-surface-2" />
        <div className="h-80 rounded-3xl bg-surface-2" />
      </div>
    </div>
  );
}

export function ScanNotFound() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-md space-y-3 py-16 text-center">
      <p className="text-5xl" aria-hidden="true">
        🔍
      </p>
      <h1 className="font-display text-2xl font-bold">{t("report.notFound")}</h1>
      <p className="text-ink-muted">{t("report.notFoundHint")}</p>
      <Link
        href="/"
        className="inline-block rounded-full bg-brand px-5 py-3 font-bold text-brand-ink hover:bg-brand-strong"
      >
        {t("report.scanAnother")}
      </Link>
    </div>
  );
}
