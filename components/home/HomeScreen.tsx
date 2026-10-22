"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";

import {
  AnalyzeRequestError,
  prepareImage,
  requestAnalysis,
  type ErrorCode,
} from "@/lib/client/analyze";
import type { ExampleId } from "@/lib/examples";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { openExample } from "@/lib/server/scan-actions";
import { AlertIcon } from "../icons";
import { ProcessingView } from "./ProcessingView";
import { ScanOptions } from "./ScanOptions";

export type Pending = { kind: "photo"; previewUrl: string } | { kind: "text"; text: string };

type State =
  | { status: "idle" }
  | { status: "processing"; pending: Pending }
  | { status: "error"; code: ErrorCode };

export function HomeScreen() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const [openingExample, startExample] = useTransition();

  const previewUrl =
    state.status === "processing" && state.pending.kind === "photo" ? state.pending.previewUrl : null;
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  // With cacheComponents this page is hidden by <Activity> instead of unmounted,
  // so state survives navigation. Reset when hidden so returning home doesn't
  // show the last scan as still processing.
  useLayoutEffect(
    () => () => {
      abortRef.current?.abort();
      abortRef.current = null;
      setState({ status: "idle" });
    },
    [],
  );

  async function run(pending: Pending, input: () => Promise<{ image: Blob } | { text: string }>) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: "processing", pending });

    try {
      const id = await requestAnalysis(await input(), locale, controller.signal);
      router.push(`/report/${id}`);
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({
        status: "error",
        code: error instanceof AnalyzeRequestError ? error.code : "upstream",
      });
    }
  }

  function analyzePhoto(file: File) {
    run({ kind: "photo", previewUrl: URL.createObjectURL(file) }, async () => ({
      image: await prepareImage(file),
    }));
  }

  function analyzeText(text: string) {
    run({ kind: "text", text }, async () => ({ text }));
  }

  function chooseExample(id: ExampleId) {
    startExample(() => openExample(id, locale));
  }

  function cancel() {
    abortRef.current?.abort();
    setState({ status: "idle" });
  }

  if (state.status === "processing") {
    return <ProcessingView pending={state.pending} onCancel={cancel} />;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{t("home.title")}</h1>
        <p className="mt-1 text-ink-muted">{t("home.subtitle")}</p>
      </div>

      {state.status === "error" && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border-2 border-avoid bg-avoid-soft p-4 text-avoid-ink sm:flex-row sm:items-center"
        >
          <AlertIcon className="shrink-0 text-2xl" />
          <div className="flex-1">
            <p className="font-bold">{t("error.title")}</p>
            <p>{t(`error.${state.code}`)}</p>
          </div>
          <button
            type="button"
            onClick={() => setState({ status: "idle" })}
            className="rounded-full border-2 border-avoid px-4 py-2 font-bold"
          >
            {t("error.tryAgain")}
          </button>
        </div>
      )}

      <ScanOptions
        onPhoto={analyzePhoto}
        onText={analyzeText}
        onExample={chooseExample}
        busy={openingExample}
      />

      <p className="text-center text-sm text-ink-muted">{t("home.privacy")}</p>
    </div>
  );
}
