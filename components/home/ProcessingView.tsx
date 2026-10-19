"use client";

import { useEffect, useState } from "react";

import { useI18n } from "@/lib/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/translate";
import { CheckIcon } from "../icons";
import type { Pending } from "./HomeScreen";

const TIPS: MessageKey[] = ["tip.1", "tip.2", "tip.3", "tip.4"];
/** The request is a single call, so steps advance on a timer while it runs. */
const CHECK_STEP_AFTER_S = 4;
const TIP_EVERY_S = 5;

type StepStatus = "done" | "working" | "waiting";

export function ProcessingView({ pending, onCancel }: { pending: Pending; onCancel: () => void }) {
  const { t } = useI18n();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const reading: StepStatus = elapsed < CHECK_STEP_AFTER_S ? "working" : "done";
  const steps: { label: MessageKey; icon: string; status: StepStatus }[] = [
    { label: pending.kind === "photo" ? "step.photo" : "step.text", icon: "📷", status: "done" },
    { label: "step.read", icon: "🔎", status: reading },
    { label: "step.check", icon: "🧠", status: reading === "done" ? "working" : "waiting" },
  ];
  // Eases towards 95% so the bar keeps moving without claiming to be finished.
  const progress = 95 - 75 * Math.exp(-elapsed / 8);
  const tip = TIPS[Math.floor(elapsed / TIP_EVERY_S) % TIPS.length];

  return (
    <div className="space-y-5">
      <h1 className="text-center font-display text-3xl font-bold" aria-live="polite">
        {t("processing.title")}
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-3xl border-2 border-line bg-surface">
          {pending.kind === "photo" ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview
            <img src={pending.previewUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="size-full overflow-hidden p-5">
              <p className="mb-2 font-display font-semibold">{t("processing.typed")}</p>
              <p className="whitespace-pre-wrap break-words text-sm text-ink-muted">{pending.text}</p>
            </div>
          )}
          <span aria-hidden="true" className="scan-line absolute inset-x-3 h-1 rounded-full bg-good shadow-[0_0_12px_var(--good)]" />
        </div>

        <div className="flex flex-col gap-3">
          <ol className="flex flex-col gap-3">
            {steps.map((step) => (
              <li
                key={step.label}
                className={`flex items-center gap-4 rounded-2xl border-2 p-4 ${
                  step.status === "waiting"
                    ? "border-dashed border-line bg-surface text-ink-muted"
                    : "border-good bg-good-soft text-good-ink"
                }`}
              >
                <span aria-hidden="true" className="text-3xl">
                  {step.icon}
                </span>
                <div className="flex-1">
                  <p className="font-display text-lg font-semibold">{t(step.label)}</p>
                  <p className="flex items-center gap-1 text-sm">
                    {step.status === "done" && <CheckIcon />}
                    {t(`status.${step.status}`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            className="h-3 overflow-hidden rounded-full border border-line bg-surface-2"
          >
            <div className="h-full rounded-full bg-good transition-[width] duration-1000" style={{ width: `${progress}%` }} />
          </div>

          <p className="rounded-2xl border-2 border-moderate bg-moderate-soft p-4 text-center text-moderate-ink">
            <span aria-hidden="true">💡 </span>
            <strong>{t("tip.label")}</strong> {t(tip)}
          </p>

          <button
            type="button"
            onClick={onCancel}
            className="self-center rounded-full px-4 py-2 font-semibold text-ink-muted hover:bg-surface-2 hover:text-ink"
          >
            {t("processing.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
