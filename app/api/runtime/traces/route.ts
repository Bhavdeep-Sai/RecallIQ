import { NextResponse } from "next/server";
import { getRuntimeDashboardData, getRuntimeRules } from "@/lib/services/runtime-analytics";

// Allow Next.js to cache this for 15 seconds before revalidating
export const revalidate = 15;

export async function GET() {
  try {
    const data = await getRuntimeDashboardData();
    const rules = await getRuntimeRules(data);

    return NextResponse.json(
      {
        traces: data.traces,
        escalations: data.escalations,
        routeMix: data.routeMix,
        modelBreakdown: data.modelBreakdown,
        costTrend: data.costTrend,
        latencyTrend: data.latencyTrend,
        kpis: {
          totalRequestsToday: data.totalRequestsToday,
          totalCostTodayCents: data.totalCostTodayCents,
          avgLatencyMs: data.avgLatencyMs,
          escalationCountToday: data.escalationCountToday,
          successRatePercent: data.successRatePercent,
          budgetUsedPercent: data.budgetUsedPercent,
          budgetRemainingCents: data.budgetRemainingCents,
          hardLimitCents: data.hardLimitCents,
          estimatedSavingsCents: data.estimatedSavingsCents,
          savingsPercent: data.savingsPercent,
        },
        rules,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
        },
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
