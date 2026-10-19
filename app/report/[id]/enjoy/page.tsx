import { Suspense } from "react";

import { ReportSkeleton } from "@/components/report/ReportFrame";
import { EnjoyView } from "@/components/report/EnjoyView";
import { loadScan } from "@/lib/server/report";

export default function Page({ params }: PageProps<"/report/[id]/enjoy">) {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <Report params={params} />
    </Suspense>
  );
}

async function Report({ params }: { params: Promise<{ id: string }> }) {
  return <EnjoyView scan={await loadScan(params)} />;
}
