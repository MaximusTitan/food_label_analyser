import { Suspense } from "react";

import { ReportSkeleton } from "@/components/report/ReportFrame";
import { IngredientsView } from "@/components/report/IngredientsView";
import { loadScan } from "@/lib/server/report";

export default function Page({ params }: PageProps<"/report/[id]/ingredients">) {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <Report params={params} />
    </Suspense>
  );
}

async function Report({ params }: { params: Promise<{ id: string }> }) {
  return <IngredientsView scan={await loadScan(params)} />;
}
