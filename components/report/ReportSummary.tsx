"use client";

import Link from "next/link";

import { TONES, type StoredScan } from "@/lib/analysis/schema";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { AlertIcon, ChevronRightIcon } from "../icons";
import { TONE_CLASSES, TONE_EMOJI, toneOrUnknown } from "../tone";
import { basisKey, formatAmount, formatDate } from "./format";
import { ReportFrame, type ReportData } from "./ReportFrame";
import { ScoreRing } from "./ScoreRing";

export function ReportSummary({ scan, photoUrl }: { scan: StoredScan; photoUrl: string | null }) {
  return (
    <ReportFrame scan={scan} backHref="/history">
      {(data) => <Summary {...data} photoUrl={photoUrl} />}
    </ReportFrame>
  );
}

function Summary({ scan, assessment, photoUrl }: ReportData & { photoUrl: string | null }) {
  const { t, locale } = useI18n();
  const { extraction } = scan;
  const verdict = TONE_CLASSES[assessment.verdict];
  const allergenList = (list: typeof extraction.allergens) =>
    list.map((a) => t(`allergen.${a}`)).join(", ");

  return (
    <>
      {(extraction.allergens.length > 0 || extraction.mayContain.length > 0) && (
        <div role="alert" className="flex gap-3 rounded-2xl border-2 border-avoid bg-avoid-soft p-4 text-avoid-ink">
          <AlertIcon className="mt-0.5 shrink-0 text-2xl" />
          <div>
            <p className="font-display text-lg font-bold">{t("allergen.title")}</p>
            {extraction.allergens.length > 0 && (
              <p className="font-semibold">{t("allergen.contains", { list: allergenList(extraction.allergens) })}</p>
            )}
            {extraction.mayContain.length > 0 && (
              <p>{t("allergen.mayContain", { list: allergenList(extraction.mayContain) })}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-2xl border-2 border-line bg-surface p-4">
            {photoUrl ? (
              <a
                href={photoUrl}
                target="_blank"
                rel="noreferrer"
                title={t("report.openPhoto")}
                className="shrink-0 overflow-hidden rounded-xl border-2 border-line hover:border-brand"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
                <img src={photoUrl} alt={t("report.photoAlt")} className="size-20 object-cover" />
              </a>
            ) : (
              <span
                aria-hidden="true"
                className={`flex size-12 shrink-0 items-center justify-center rounded-full font-display text-xl font-bold ${verdict.solid}`}
              >
                {extraction.productName.charAt(0).toUpperCase() || "?"}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold leading-tight">{extraction.productName}</h1>
              <p className="text-sm text-ink-muted">
                {t("report.scannedOn", { date: formatDate(locale, scan.createdAt) })}
                {scan.source === "example" && (
                  <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold">
                    {t("report.example")}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-line bg-surface p-6">
            <ScoreRing score={assessment.score} verdict={assessment.verdict} />
            {assessment.score === null && <p className="text-center text-sm text-ink-muted">{t("report.noScoreHint")}</p>}
            <p className={`w-full rounded-2xl border-2 px-4 py-3 text-center font-display text-xl font-bold ${verdict.soft} ${verdict.border}`}>
              <span aria-hidden="true">{TONE_EMOJI[assessment.verdict]} </span>
              {t(`verdict.${assessment.verdict}`)}
            </p>
            <div className="grid w-full grid-cols-3 gap-2" aria-hidden="true">
              {TONES.map((tone) => (
                <span
                  key={tone}
                  className={`rounded-xl border-2 py-2 text-center text-sm font-semibold ${TONE_CLASSES[tone].soft} ${
                    tone === assessment.verdict ? "border-ink" : "border-transparent opacity-70"
                  }`}
                >
                  {t(`tone.${tone}`)}
                </span>
              ))}
            </div>
            <p className="text-xs text-ink-muted">{t("tone.legend")}</p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="rounded-3xl border-2 border-line bg-surface p-5">
            <h2 className="mb-4 font-display text-xl font-bold">{t("facts.title")}</h2>
            <ul className="space-y-4">
              {assessment.facts.map((fact) => {
                const tone = TONE_CLASSES[toneOrUnknown(fact.tone)];
                const amount = formatAmount(locale, fact);
                return (
                  <li key={fact.key} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3">
                    <div>
                      <p className="font-semibold">{t(`fact.${fact.key}`)}</p>
                      <p className="text-xs text-ink-muted">
                        {amount ? `${amount} ${t(basisKey(fact, extraction.isDrink))}` : t("fact.notListed")}
                      </p>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                      <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.max(fact.fill * 100, fact.level ? 6 : 0)}%` }} />
                    </div>
                    <span className={`min-w-16 rounded-lg px-2 py-1 text-center text-xs font-bold ${tone.soft}`}>
                      {fact.level ? t(`level.${fact.level}`) : "–"}
                    </span>
                  </li>
                );
              })}
            </ul>
            {assessment.sugarTeaspoons !== null && assessment.sugarTeaspoons > 0 && (
              <p className="mt-4 rounded-xl bg-surface-2 p-3 text-sm">
                <span aria-hidden="true">🥄 </span>
                {t(
                  assessment.facts[0].basis === "serving" ? "report.sugarSpoons" : "report.sugarSpoonsPer100",
                  { count: assessment.sugarTeaspoons },
                )}
              </p>
            )}
          </div>

          <div className="rounded-3xl border-2 border-line bg-surface p-5">
            {extraction.summary && <p className="mb-3">{extraction.summary}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <PointList title={t("report.benefits")} items={extraction.benefits} tone="good" />
              <PointList
                title={t("report.risks")}
                items={assessment.transFat ? [t("report.transFat"), ...extraction.risks] : extraction.risks}
                tone="avoid"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href={`/report/${scan.id}/ingredients`}
              className="flex items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-4 font-display text-lg font-bold text-brand-ink hover:bg-brand-strong"
            >
              {t("report.seeIngredients")} <ChevronRightIcon />
            </Link>
            <Link
              href={`/report/${scan.id}/enjoy`}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-brand px-5 py-4 font-display text-lg font-bold text-brand hover:bg-brand-soft"
            >
              {t("report.howToEnjoy")} <ChevronRightIcon />
            </Link>
          </div>
          <p className="text-center text-xs text-ink-muted">{t("report.disclaimer")}</p>
        </section>
      </div>
    </>
  );
}

function PointList({ title, items, tone }: { title: string; items: string[]; tone: "good" | "avoid" }) {
  if (items.length === 0) return null;
  return (
    <div className={`rounded-2xl p-3 ${TONE_CLASSES[tone].soft}`}>
      <p className="mb-1 font-display font-bold">{title}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
