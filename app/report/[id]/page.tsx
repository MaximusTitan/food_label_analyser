import { Suspense } from "react";

import { ReportSkeleton } from "@/components/report/ReportFrame";
import { ReportSummary } from "@/components/report/ReportSummary";
import { loadScan } from "@/lib/server/report";
import { getScanPhotoUrl } from "@/lib/server/scans";

export default function Page({ params }: PageProps<"/report/[id]">) {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <Report params={params} />
    </Suspense>
  );
}

async function Report({ params }: { params: Promise<{ id: string }> }) {
  const scan = await loadScan(params);
  const photoUrl = scan.source === "photo" ? await getScanPhotoUrl(scan.id) : null;
  return <ReportSummary scan={scan} photoUrl={photoUrl} />;
}
