"use client";

import Link from "next/link";
import { useMemo, useOptimistic, useState, useTransition, type ReactNode } from "react";

import type { StoredScan } from "@/lib/analysis/schema";
import { assess, type Assessment, type FactKey } from "@/lib/analysis/score";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { removeScan } from "@/lib/server/scan-actions";
import { TrashIcon } from "../icons";
import { formatAmount, formatDate } from "../report/format";
import { ScoreRing } from "../report/ScoreRing";
import { TONE_CLASSES, toneOrUnknown } from "../tone";

interface Item {
  scan: StoredScan;
  assessment: Assessment;
}

const COMPARE_FACTS: FactKey[] = ["sugar", "salt", "fibre", "calories"];

export function HistoryScreen({ scans: savedScans }: { scans: StoredScan[] }) {
  const { t, locale } = useI18n();
  const [, startRemoving] = useTransition();
  // Hide a deleted scan straight away; the server refresh then confirms it.
  const [scans, hideScan] = useOptimistic(savedScans, (current, id: string) =>
    current.filter((scan) => scan.id !== id),
  );
  const items = useMemo<Item[]>(
    () => scans.map((scan) => ({ scan, assessment: assess(scan.extraction) })),
    [scans],
  );
  // null = nothing chosen yet, so default to the two newest scans.
  const [picked, setPicked] = useState<string[] | null>(null);
  const selected = (picked ?? items.slice(0, 2).map((i) => i.scan.id)).filter((id) =>
    items.some((i) => i.scan.id === id),
  );

  function toggle(id: string) {
    setPicked(
      selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id].slice(-2),
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-3 py-16 text-center">
        <p className="text-5xl" aria-hidden="true">
          🛒
        </p>
        <h1 className="font-display text-2xl font-bold">{t("history.empty")}</h1>
        <Link
          href="/"
          className="inline-block rounded-full bg-brand px-5 py-3 font-bold text-brand-ink hover:bg-brand-strong"
        >
          {t("history.emptyCta")}
        </Link>
      </div>
    );
  }

  const compared = selected
    .map((id) => items.find((i) => i.scan.id === id))
    .filter((i): i is Item => Boolean(i));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <section>
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h1 className="font-display text-3xl font-bold">{t("history.title")}</h1>
          <p className="text-sm text-ink-muted">{t("history.tickTwo")}</p>
        </div>
        <ul className="space-y-3">
          {items.map(({ scan, assessment }) => {
            const isSelected = selected.includes(scan.id);
            const tone = TONE_CLASSES[assessment.verdict];
            const name = scan.extraction.productName;
            return (
              <li
                key={scan.id}
                className={`flex items-center gap-3 rounded-2xl border-2 p-3 ${
                  isSelected ? "border-good bg-good-soft" : "border-line bg-surface"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(scan.id)}
                  aria-label={t("history.select", { name })}
                  className="size-5 shrink-0 accent-[var(--good)]"
                />
                <Link href={`/report/${scan.id}`} className="min-w-0 flex-1 hover:underline">
                  <p className="truncate font-display text-lg font-semibold">{name}</p>
                  <p className="text-xs text-ink-muted">{formatDate(locale, scan.createdAt)}</p>
                </Link>
                <span className={`rounded-lg px-2 py-1 text-sm font-bold tabular-nums ${tone.soft}`}>
                  {assessment.score === null ? "?" : `${assessment.score}/10`}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    startRemoving(async () => {
                      hideScan(scan.id);
                      await removeScan(scan.id);
                    })
                  }
                  aria-label={t("history.remove", { name })}
                  className="rounded-full p-2 text-ink-muted hover:bg-avoid-soft hover:text-avoid-ink"
                >
                  <TrashIcon />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-3xl border-2 border-line bg-surface p-4 sm:p-5" aria-live="polite">
        <h2 className="mb-1 font-display text-2xl font-bold">{t("history.compareTitle")}</h2>
        {compared.length < 2 ? (
          <p className="py-10 text-center text-ink-muted">{t("history.comparePick")}</p>
        ) : (
          <Compare a={compared[0]} b={compared[1]} />
        )}
      </section>
    </div>
  );
}

function Compare({ a, b }: { a: Item; b: Item }) {
  const { t, locale } = useI18n();
  const pair = [a, b];
  const [scoreA, scoreB] = pair.map((i) => i.assessment.score ?? -1);
  const better = scoreA === scoreB ? null : scoreA > scoreB ? 0 : 1;
  const additives = pair.map((i) => i.scan.extraction.ingredients.filter((x) => x.tags.includes("additive")).length);

  return (
    <div>
      <p className="mb-4 text-xs text-ink-muted">{t("history.per100")}</p>
      <div className="grid grid-cols-[5.5rem_1fr_1fr] items-center gap-2 sm:grid-cols-[7rem_1fr_1fr] sm:gap-3">
        <span />
        {pair.map((item, index) => (
          <div
            key={item.scan.id}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center ${
              better === index ? "border-good bg-good-soft" : "border-line"
            }`}
          >
            <ScoreRing score={item.assessment.score} verdict={item.assessment.verdict} size="sm" />
            <p className="line-clamp-2 text-sm font-semibold">{item.scan.extraction.productName}</p>
            {better === index && (
              <span className="rounded-full bg-good px-2 py-0.5 text-xs font-bold text-white">
                <span aria-hidden="true">🏆 </span>
                {t("history.better")}
              </span>
            )}
          </div>
        ))}

        {COMPARE_FACTS.map((key) => (
          <Row key={key} label={t(`fact.${key}`)}>
            {pair.map((item) => {
              const fact = item.assessment.facts.find((f) => f.key === key)!;
              const value = formatAmount(locale, { amount: fact.per100, unit: fact.unit });
              return (
                <Cell key={item.scan.id} className={TONE_CLASSES[toneOrUnknown(fact.tone)].soft}>
                  {value ?? "–"}
                </Cell>
              );
            })}
          </Row>
        ))}

        <Row label={t("history.additives")}>
          {additives.map((count, index) => (
            <Cell
              key={pair[index].scan.id}
              className={TONE_CLASSES[count === 0 ? "good" : count < 3 ? "moderate" : "avoid"].soft}
            >
              {count === 0 ? t("history.none") : t("history.found", { count })}
            </Cell>
          ))}
        </Row>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span className="text-sm font-semibold text-ink-muted">{label}</span>
      {children}
    </>
  );
}

function Cell({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`rounded-xl px-2 py-2 text-center text-sm font-bold tabular-nums ${className}`}>
      {children}
    </span>
  );
}
