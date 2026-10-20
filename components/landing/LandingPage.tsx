"use client";

import Image from "next/image";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

import type { Verdict } from "@/lib/analysis/score";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/translate";
import {
  AlertIcon,
  CameraIcon,
  CheckIcon,
  ChevronRightIcon,
  GaugeIcon,
  GlobeIcon,
  ListIcon,
  ScaleIcon,
  ShieldIcon,
  SparkleIcon,
  SwapIcon,
} from "../icons";
import { ScoreRing } from "../report/ScoreRing";
import { TONE_CLASSES, TONE_EMOJI } from "../tone";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const STEPS: { icon: IconType; title: MessageKey; body: MessageKey }[] = [
  { icon: CameraIcon, title: "landing.step1Title", body: "landing.step1Body" },
  { icon: SparkleIcon, title: "landing.step2Title", body: "landing.step2Body" },
  { icon: CheckIcon, title: "landing.step3Title", body: "landing.step3Body" },
];

const FEATURES: { icon: IconType; title: MessageKey; body: MessageKey; tint: string }[] = [
  { icon: GaugeIcon, title: "landing.featScoreTitle", body: "landing.featScoreBody", tint: "bg-good-soft text-good-ink" },
  { icon: ListIcon, title: "landing.featIngredientsTitle", body: "landing.featIngredientsBody", tint: "bg-accent-soft text-accent" },
  { icon: ShieldIcon, title: "landing.featAllergenTitle", body: "landing.featAllergenBody", tint: "bg-avoid-soft text-avoid-ink" },
  { icon: SwapIcon, title: "landing.featSwapsTitle", body: "landing.featSwapsBody", tint: "bg-moderate-soft text-moderate-ink" },
  { icon: ScaleIcon, title: "landing.featCompareTitle", body: "landing.featCompareBody", tint: "bg-brand-soft text-brand-strong" },
  { icon: GlobeIcon, title: "landing.featLanguageTitle", body: "landing.featLanguageBody", tint: "bg-surface-2 text-logo-ink" },
];

const LIGHTS: Verdict[] = ["good", "moderate", "avoid"];

const PRIMARY_CTA =
  "inline-flex items-center justify-center gap-1 rounded-2xl bg-brand px-6 py-3.5 font-display text-lg font-bold text-brand-ink shadow-sm transition-colors hover:bg-brand-strong";
const SECONDARY_CTA =
  "inline-flex items-center justify-center rounded-2xl border-2 border-line bg-surface px-6 py-3 font-display text-lg font-bold text-ink transition-colors hover:border-brand hover:text-brand-strong";

export function LandingPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-20 pt-4 sm:space-y-28 sm:pt-10">
      <section className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr]">
        <div className="text-center md:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm font-semibold text-ink-muted">
            <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
            {t("landing.badge")}
          </p>
          <h1 className="mt-5 font-display text-4xl leading-[1.05] font-bold text-balance text-logo-ink sm:text-5xl lg:text-6xl">
            {t("landing.title")} <span className="text-brand">{t("landing.titleHighlight")}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-pretty text-ink-muted md:mx-0">{t("landing.subtitle")}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
            <Link href="/signup" className={PRIMARY_CTA}>
              {t("landing.ctaPrimary")}
              <ChevronRightIcon className="text-xl" />
            </Link>
            <Link href="/login" className={SECONDARY_CTA}>
              {t("landing.ctaSecondary")}
            </Link>
          </div>
          <p className="mt-3 text-sm text-ink-muted">{t("landing.ctaNote")}</p>
        </div>

        <DemoCard />
      </section>

      <section aria-labelledby="how-heading">
        <div className="text-center">
          <h2 id="how-heading" className="font-display text-3xl font-bold text-logo-ink sm:text-4xl">
            {t("landing.howTitle")}
          </h2>
          <p className="mt-2 text-ink-muted">{t("landing.howSubtitle")}</p>
        </div>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <li key={title} className="relative rounded-3xl border-2 border-line bg-surface p-6">
              <span className="absolute right-5 top-4 font-display text-5xl font-bold text-surface-2" aria-hidden="true">
                {index + 1}
              </span>
              <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-2xl text-brand-ink">
                <Icon />
              </span>
              <h3 className="mt-4 font-display text-xl font-bold">{t(title)}</h3>
              <p className="mt-1 text-ink-muted">{t(body)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="lights-heading" className="rounded-[2rem] bg-logo-ink px-6 py-12 text-center sm:px-12">
        <h2 id="lights-heading" className="font-display text-3xl font-bold text-bg sm:text-4xl">
          {t("landing.lightsTitle")}
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-bg/75">{t("landing.lightsBody")}</p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-3">
          {LIGHTS.map((verdict) => (
            <li
              key={verdict}
              className={`flex items-center gap-3 rounded-2xl p-4 text-left font-display text-lg font-bold ${TONE_CLASSES[verdict].soft}`}
            >
              <span aria-hidden="true" className={`size-5 shrink-0 rounded-full ${TONE_CLASSES[verdict].bar}`} />
              {t(`verdict.${verdict}`)}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="features-heading">
        <h2
          id="features-heading"
          className="mx-auto max-w-2xl text-center font-display text-3xl font-bold text-balance text-logo-ink sm:text-4xl"
        >
          {t("landing.featuresTitle")}
        </h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body, tint }) => (
            <li key={title} className="rounded-3xl border-2 border-line bg-surface p-6">
              <span className={`flex size-11 items-center justify-center rounded-xl text-2xl ${tint}`}>
                <Icon />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold">{t(title)}</h3>
              <p className="mt-1 text-ink-muted">{t(body)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border-2 border-good bg-good-soft px-6 py-12 text-center sm:px-12">
        <Image
          src="/logo-mark.png"
          alt=""
          width={274}
          height={469}
          className="pointer-events-none absolute -right-6 -bottom-10 hidden h-56 w-auto rotate-12 opacity-15 sm:block"
        />
        <h2 className="font-display text-3xl font-bold text-balance text-good-ink sm:text-4xl">{t("landing.finalTitle")}</h2>
        <p className="mx-auto mt-2 max-w-md text-good-ink/80">{t("landing.finalBody")}</p>
        <Link href="/signup" className={`${PRIMARY_CTA} mt-7`}>
          {t("landing.finalCta")}
          <ChevronRightIcon className="text-xl" />
        </Link>
      </section>

      <footer className="flex flex-col items-center gap-4 border-t border-line pt-10 text-center text-sm text-ink-muted">
        <span className="rounded-2xl bg-white px-5 py-3">
          <Image src="/logo.png" alt={t("app.name")} width={785} height={500} className="h-16 w-auto" />
        </span>
        <p>{t("landing.footer")}</p>
        <p>{t("report.disclaimer")}</p>
      </footer>
    </div>
  );
}

/** A static preview of what a report looks like. */
function DemoCard() {
  const { t } = useI18n();
  const facts: { name: MessageKey; level: "high" | "medium" | "low"; tone: Verdict }[] = [
    { name: "fact.sugar", level: "high", tone: "avoid" },
    { name: "fact.salt", level: "medium", tone: "moderate" },
    { name: "fact.fibre", level: "low", tone: "avoid" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div aria-hidden="true" className="absolute -inset-6 -z-10 rounded-[3rem] bg-brand-soft blur-2xl" />
      <figure className="float rounded-[2rem] border-2 border-line bg-surface p-5 shadow-xl shadow-black/5">
        <figcaption className="text-xs font-bold tracking-wide text-ink-muted uppercase">{t("landing.demoLabel")}</figcaption>
        <p className="mt-2 font-display text-xl font-bold">{t("landing.demoProduct")}</p>

        <div className="mt-4 flex items-center gap-4">
          <ScoreRing score={3} verdict="avoid" size="sm" />
          <p className={`flex-1 rounded-2xl px-3 py-2 font-display font-bold ${TONE_CLASSES.avoid.soft}`}>
            {TONE_EMOJI.avoid} {t("verdict.avoid")}
          </p>
        </div>

        <ul className="mt-4 space-y-2">
          {facts.map(({ name, level, tone }) => (
            <li key={name} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-sm">
              <span className="font-semibold">{t(name)}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${TONE_CLASSES[tone].solid}`}>
                {t(`level.${level}`)}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-sm text-ink-muted">{t("report.sugarSpoons", { count: 3 })}</p>

        <p className="mt-3 flex items-center gap-2 rounded-xl border-2 border-avoid bg-avoid-soft px-3 py-2 text-sm font-semibold text-avoid-ink">
          <AlertIcon className="shrink-0 text-lg" />
          {t("allergen.contains", { list: `${t("allergen.milk")}, ${t("allergen.gluten")}` })}
        </p>
      </figure>
    </div>
  );
}
