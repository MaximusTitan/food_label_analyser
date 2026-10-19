import type { Metadata } from "next";
import { Suspense } from "react";

import { HistoryScreen } from "@/components/history/HistoryScreen";
import { requireUser } from "@/lib/server/auth";
import { listScans } from "@/lib/server/scans";

export const metadata: Metadata = { title: "My scans" };

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-surface-2" aria-busy="true" />}>
      <History />
    </Suspense>
  );
}

async function History() {
  await requireUser();
  return <HistoryScreen scans={await listScans()} />;
}
