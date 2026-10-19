"use client";

import Link from "next/link";
import { useState } from "react";

import type { IngredientTag, StoredScan } from "@/lib/analysis/schema";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { ChevronRightIcon, SearchIcon } from "../icons";
import { TONE_CLASSES } from "../tone";
import { ReportFrame, type ReportData } from "./ReportFrame";

const FILTERS = ["all", "additive", "sugar", "allergen"] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_EMOJI: Record<Filter, string> = { all: "", additive: "🧪", sugar: "🍬", allergen: "⚠️" };

export function IngredientsView({ scan }: { scan: StoredScan }) {
  return (
    <ReportFrame scan={scan} backHref={`/report/${scan.id}`}>
      {(data) => <Ingredients {...data} />}
    </ReportFrame>
  );
}

function Ingredients({ scan }: ReportData) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<Filter>("all");
  const { ingredients } = scan.extraction;
  const shown =
    filter === "all" ? ingredients : ingredients.filter((i) => i.tags.includes(filter as IngredientTag));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
            {t("ingredients.title")} <SearchIcon className="text-brand" />
          </h1>
          <p className="text-sm text-ink-muted">
            {scan.extraction.productName} · {t("ingredients.orderHint")}
          </p>
        </div>
        <div role="group" aria-label={t("ingredients.title")} className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors ${
                filter === f ? "border-brand bg-brand-soft text-ink" : "border-line bg-surface text-ink-muted hover:border-brand"
              }`}
            >
              {FILTER_EMOJI[f] && <span aria-hidden="true">{FILTER_EMOJI[f]} </span>}
              {t(`filter.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {ingredients.length === 0 ? (
        <p className="rounded-2xl bg-surface p-6 text-center text-ink-muted">{t("ingredients.none")}</p>
      ) : shown.length === 0 ? (
        <p className="rounded-2xl bg-surface p-6 text-center text-ink-muted">{t("ingredients.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((ingredient, index) => {
            const tone = TONE_CLASSES[ingredient.tone];
            const badge = ingredient.tags[0];
            return (
              <li
                key={`${ingredient.name}-${index}`}
                className={`grid gap-2 rounded-2xl border-2 border-l-8 border-line bg-surface p-4 sm:grid-cols-[14rem_1fr] sm:items-center ${tone.borderLeft}`}
              >
                <div>
                  <p className="font-display text-lg font-semibold leading-tight">{ingredient.name}</p>
                  <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-bold ${tone.soft}`}>
                    {badge ? t(`tag.${badge}`) : t(`tone.${ingredient.tone}`)}
                    {ingredient.eNumber && ` · ${ingredient.eNumber}`}
                  </span>
                </div>
                <p className="text-ink-muted">{ingredient.explanation}</p>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href={`/report/${scan.id}/enjoy`}
        className="flex items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-4 font-display text-lg font-bold text-brand-ink hover:bg-brand-strong sm:ml-auto sm:w-fit"
      >
        {t("report.howToEnjoy")} <ChevronRightIcon />
      </Link>
    </section>
  );
}
