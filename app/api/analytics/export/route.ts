import { NextResponse } from "next/server";
import { getAnalyticsSeries, getBudgetSummary, getDashboardMetrics } from "@/lib/services/analytics";

export async function GET() {
  try {
    const [metrics, series, budget] = await Promise.all([
      getDashboardMetrics(),
      getAnalyticsSeries(),
      getBudgetSummary(),
    ]);

    const rows = [
      ["section", "label", "value", "note"],
      ...metrics.map((metric) => ["metric", metric.label, metric.value, metric.note ?? ""]),
      ...series.map((point) => ["series", point.label, String(point.value), "weekly activity"]),
      ["budget", "monthlySpend", budget.monthlySpend !== null ? String(budget.monthlySpend) : "", "monthly spend"],
      ["budget", "budgetUsed", budget.budgetUsed !== null ? String(budget.budgetUsed) : "", "budget utilization"],
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="recalliq-analytics.csv"',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
