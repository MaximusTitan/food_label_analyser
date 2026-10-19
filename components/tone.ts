import type { Tone } from "@/lib/analysis/schema";
import type { Verdict } from "@/lib/analysis/score";

/** Static class names so Tailwind can see them. */
export const TONE_CLASSES: Record<
  Verdict,
  { solid: string; soft: string; text: string; border: string; borderLeft: string; bar: string }
> = {
  good: {
    solid: "bg-good text-white",
    soft: "bg-good-soft text-good-ink",
    text: "text-good-ink",
    border: "border-good",
    borderLeft: "border-l-good",
    bar: "bg-good",
  },
  moderate: {
    solid: "bg-moderate text-moderate-ink",
    soft: "bg-moderate-soft text-moderate-ink",
    text: "text-moderate-ink",
    border: "border-moderate",
    borderLeft: "border-l-moderate",
    bar: "bg-moderate",
  },
  avoid: {
    solid: "bg-avoid text-white",
    soft: "bg-avoid-soft text-avoid-ink",
    text: "text-avoid-ink",
    border: "border-avoid",
    borderLeft: "border-l-avoid",
    bar: "bg-avoid",
  },
  unknown: {
    solid: "bg-surface-2 text-ink",
    soft: "bg-surface-2 text-ink-muted",
    text: "text-ink-muted",
    border: "border-line",
    borderLeft: "border-l-line",
    bar: "bg-line",
  },
};

export const TONE_EMOJI: Record<Verdict, string> = {
  good: "😀",
  moderate: "🙂",
  avoid: "😟",
  unknown: "🤔",
};

export function toneOrUnknown(tone: Tone | null): Verdict {
  return tone ?? "unknown";
}
