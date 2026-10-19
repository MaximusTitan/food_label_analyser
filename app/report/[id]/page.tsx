import { Suspense } from "react";

import { ReportSkeleton } from "@/components/report/ReportFrame";
import { ReportSummary } from "@/components/report/ReportSummary";
import { loadScan } from "@/lib/server/report";

export default function Page({ params }: PageProps<"/report/[id]">) {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <Report params={params} />
    </Suspense>
  );
}

async function Report({ params }: { params: Promise<{ id: string }> }) {
  return <ReportSummary scan={await loadScan(params)} />;
}
