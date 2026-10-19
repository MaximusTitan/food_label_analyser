"use client";

import { useRef, useState, type DragEvent } from "react";

import { MAX_TEXT_LENGTH, MIN_TEXT_LENGTH } from "@/lib/limits";
import { EXAMPLE_IDS, type ExampleId } from "@/lib/examples";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { CameraIcon, ImageIcon, PencilIcon } from "../icons";

const EXAMPLE_EMOJI: Record<ExampleId, string> = {
  cereal: "🥣",
  chocolate: "🍫",
  juice: "🧃",
  biscuits: "🍪",
};

interface Props {
  onPhoto: (file: File) => void;
  onText: (text: string) => void;
  onExample: (id: ExampleId) => void;
  /** True while an example scan is being created. */
  busy: boolean;
}

export function ScanOptions({ onPhoto, onText, onExample, busy }: Props) {
  const { t } = useI18n();
  const cameraInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [text, setText] = useState("");

  function takeFile(files: FileList | null) {
    const file = files?.[0];
    if (file) onPhoto(file);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    takeFile(event.dataTransfer.files);
  }

  const trimmed = text.trim();
  const canSubmit = trimmed.length >= MIN_TEXT_LENGTH && trimmed.length <= MAX_TEXT_LENGTH;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <section
          aria-labelledby="scan-heading"
          className="relative flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-good bg-good-soft p-8 text-center"
        >
          <span aria-hidden="true" className="absolute left-4 top-4 size-8 rounded-tl-lg border-l-4 border-t-4 border-good" />
          <span aria-hidden="true" className="absolute right-4 top-4 size-8 rounded-tr-lg border-r-4 border-t-4 border-good" />
          <span aria-hidden="true" className="absolute bottom-4 left-4 size-8 rounded-bl-lg border-b-4 border-l-4 border-good" />
          <span aria-hidden="true" className="absolute bottom-4 right-4 size-8 rounded-br-lg border-b-4 border-r-4 border-good" />
          <CameraIcon className="text-6xl text-good-ink" />
          <h2 id="scan-heading" className="font-display text-xl font-semibold text-good-ink">
            {t("scan.pointAtLabel")}
          </h2>
          <input
            ref={cameraInput}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              takeFile(event.target.files);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => cameraInput.current?.click()}
            className="w-full max-w-xs rounded-2xl bg-brand px-6 py-4 font-display text-xl font-bold text-brand-ink shadow-sm transition-colors hover:bg-brand-strong"
          >
            {t("scan.button")}
          </button>
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-3xl border-2 border-line bg-surface p-4">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
              <ImageIcon className="text-brand" /> {t("upload.title")}
            </h2>
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`flex min-h-24 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center text-sm transition-colors focus-within:outline focus-within:outline-3 focus-within:outline-[var(--focus)] ${
                dragging
                  ? "border-brand bg-brand-soft text-ink"
                  : "border-line bg-surface-2 text-ink-muted hover:border-brand"
              }`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                className="sr-only"
                onChange={(event) => {
                  takeFile(event.target.files);
                  event.target.value = "";
                }}
              />
              {dragging ? t("upload.dropActive") : t("upload.drop")}
            </label>
          </section>

          <section className="flex-1 rounded-3xl border-2 border-line bg-surface p-4">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (canSubmit) onText(trimmed);
              }}
              className="flex h-full flex-col gap-3"
            >
              <label htmlFor="ingredients-text" className="flex items-center gap-2 font-display text-lg font-semibold">
                <PencilIcon className="text-brand" /> {t("type.title")}
              </label>
              <textarea
                id="ingredients-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={MAX_TEXT_LENGTH}
                rows={3}
                placeholder={t("type.placeholder")}
                aria-describedby="ingredients-hint"
                className="min-h-20 flex-1 resize-y rounded-2xl border-2 border-line bg-surface-2 p-3 text-ink placeholder:text-ink-muted"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p id="ingredients-hint" className="text-sm text-ink-muted">
                  {t("type.hint")}
                </p>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("type.submit")}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>

      <section aria-labelledby="examples-heading">
        <h2 id="examples-heading" className="mb-2 font-display text-lg font-semibold">
          {t("examples.title")}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-busy={busy}>
          {EXAMPLE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onExample(id)}
              disabled={busy}
              className="flex disabled:cursor-wait disabled:opacity-60 items-center justify-center gap-2 rounded-2xl border-2 border-moderate bg-moderate-soft px-3 py-3 font-semibold text-moderate-ink transition-transform hover:-translate-y-0.5"
            >
              <span aria-hidden="true">{EXAMPLE_EMOJI[id]}</span>
              {t(`examples.${id}`)}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
