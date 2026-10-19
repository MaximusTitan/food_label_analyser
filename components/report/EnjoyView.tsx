"use client";

import type { ReactNode } from "react";

import type { StoredScan } from "@/lib/analysis/schema";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/translate";
import { BanIcon, SwapIcon } from "../icons";
import { TONE_CLASSES, TONE_EMOJI } from "../tone";
import { ReportFrame, type ReportData } from "./ReportFrame";

/** Which weekdays light up for each recommended frequency. */
const ACTIVE_DAYS: Record<number, number[]> = {
  5: [0, 1, 2, 3, 4],
  2: [1, 4],
  1: [5],
};

const FREQUENCY_KEY: Record<number, MessageKey> = {
  5: "enjoy.freq.5",
  2: "enjoy.freq.2",
  1: "enjoy.freq.1",
};

export function EnjoyView({ scan }: { scan: StoredScan }) {
  return (
    <ReportFrame scan={scan} backHref={`/report/${scan.id}`}>
      {(data) => <Enjoy {...data} />}
    </ReportFrame>
  );
}

function Enjoy({ scan, assessment }: ReportData) {
  const { t } = useI18n();
  const { extraction } = scan;
  const verdict = TONE_CLASSES[assessment.verdict];
  const days = t("enjoy.days").split(",");
  const active = ACTIVE_DAYS[assessment.timesPerWeek] ?? [];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">
          {t("enjoy.title")} <span aria-hidden="true">🥣</span>
        </h1>
        <p className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold ${verdict.soft} ${verdict.border}`}>
          <span aria-hidden="true">{TONE_EMOJI[assessment.verdict]} </span>
          {t(`verdict.${assessment.verdict}`)}
        </p>
      </div>
      <p className="text-ink-muted">{extraction.productName}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border-2 border-line bg-surface p-5 text-center">
          <h2 className="mb-3 text-left font-display text-lg font-semibold">{t("enjoy.serving")}</h2>
          <p className="text-5xl" aria-hidden="true">
            🥄
          </p>
          <p className="mt-3 font-display text-2xl font-bold">
            {extraction.servingSize.description || t("enjoy.servingUnknown")}
          </p>
          {assessment.sugarTeaspoons !== null && assessment.sugarTeaspoons > 0 && (
            <p className="mt-1 text-sm text-ink-muted">
              {t(
                assessment.facts[0].basis === "serving" ? "report.sugarSpoons" : "report.sugarSpoonsPer100",
                { count: assessment.sugarTeaspoons },
              )}
            </p>
          )}
        </div>

        <div className="rounded-3xl border-2 border-line bg-surface p-5 text-center">
          <h2 className="mb-3 text-left font-display text-lg font-semibold">{t("enjoy.howOften")}</h2>
          <p className="font-display text-2xl font-bold">
            {t(FREQUENCY_KEY[assessment.timesPerWeek] ?? "enjoy.freq.1")}
          </p>
          <ol
            className="mt-4 flex justify-center gap-2"
            aria-label={t("enjoy.daysAria", { count: active.length })}
          >
            {days.map((day, index) => (
              <li key={index} className="flex flex-col items-center gap-1 text-xs text-ink-muted">
                <span
                  className={`size-8 rounded-full border-2 ${
                    active.includes(index) ? `${verdict.bar} ${verdict.border}` : "border-dashed border-line"
                  }`}
                />
                {day}
              </li>
            ))}
          </ol>
        </div>

        <ListCard
          title={t("enjoy.skip")}
          icon={<BanIcon />}
          items={extraction.whoShouldSkip}
          empty={t("enjoy.skipNone")}
          className="border-avoid bg-avoid-soft text-avoid-ink"
        />
        <ListCard
          title={t("enjoy.swaps")}
          icon={<SwapIcon />}
          items={extraction.healthierSwaps}
          empty={t("enjoy.swapsNone")}
          className="border-good bg-good-soft text-good-ink"
          pills
        />
      </div>
      <p className="text-center text-xs text-ink-muted">{t("report.disclaimer")}</p>
    </section>
  );
}

function ListCard({
  title,
  icon,
  items,
  empty,
  className,
  pills = false,
}: {
  title: string;
  icon: ReactNode;
  items: string[];
  empty: string;
  className: string;
  pills?: boolean;
}) {
  return (
    <div className={`rounded-3xl border-2 p-5 ${className}`}>
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
        {icon} {title}
      </h2>
      {items.length === 0 ? (
        <p>{empty}</p>
      ) : pills ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item} className="rounded-xl border-2 border-current/20 bg-surface px-4 py-2 text-center font-semibold text-ink">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="list-disc space-y-1 pl-5">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
