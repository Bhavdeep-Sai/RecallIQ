import { Suspense } from "react";
import { RuntimeDashboard } from "@/components/dashboard/runtime/runtime-dashboard";
import { getRuntimeDashboardData, getRuntimeRules } from "@/lib/services/runtime-analytics";
import { LoadingState } from "@/components/system/loading-state";

// Revalidate every 30 seconds so the server-rendered data stays fresh
export const revalidate = 30;

async function RuntimeIntelligenceContent() {
  const data = await getRuntimeDashboardData();
  const rules = await getRuntimeRules(data);
  return <RuntimeDashboard data={data} rules={rules} />;
}

export default function RuntimeIntelligencePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading runtime intelligence..." />}>
      <RuntimeIntelligenceContent />
    </Suspense>
  );
}
