"use client";

import type { Verdict } from "@/lib/analysis/score";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { TONE_CLASSES } from "../tone";

const SIZES = {
  lg: { box: "size-44", score: "text-5xl", caption: "text-sm" },
  sm: { box: "size-20", score: "text-xl", caption: "text-[0.65rem]" },
};

export function ScoreRing({
  score,
  verdict,
  size = "lg",
}: {
  score: number | null;
  verdict: Verdict;
  size?: keyof typeof SIZES;
}) {
  const { t } = useI18n();
  const s = SIZES[size];
  const tone = TONE_CLASSES[verdict];

  return (
    <div
      role="img"
      aria-label={score === null ? t("verdict.unknown") : t("report.scoreAria", { score })}
      className={`${s.box} ${tone.soft} ${tone.border} flex shrink-0 flex-col items-center justify-center rounded-full border-[6px]`}
    >
      <span className={`${s.score} font-display font-bold leading-none tabular-nums`}>
        {score === null ? t("report.noScore") : `${score}/10`}
      </span>
      {size === "lg" && <span className={`${s.caption} mt-1 font-semibold`}>{t("report.healthScore")}</span>}
    </div>
  );
}
