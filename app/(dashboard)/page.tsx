import { OverviewDashboard } from "@/components/dashboard/overview-dashboard";
import {
  getAnalyticsSeries,
  getBudgetSummary,
  getDashboardMetrics,
  getRuntimeRules,
  productPrinciples,
} from "@/lib/services/analytics";
import { getSupabaseAdmin } from "@/lib/db/client";

export default async function DashboardHomePage() {
  const [dashboardMetrics, analyticsSeries, runtimeRules, budgetSummary] = await Promise.all([
    getDashboardMetrics(),
    getAnalyticsSeries(),
    getRuntimeRules(),
    getBudgetSummary(),
  ]);

  let memoryEntries: any[] = [];
  let totalMemoryCount = 0;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = getSupabaseAdmin();
      const [{ data, error }, { count }] = await Promise.all([
        supabase
          .from("ai_memory_entries")
          .select("*")
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("ai_memory_entries")
          .select("*", { count: "exact", head: true })
          .is("deleted_at", null),
      ]);

      if (!error && data) {
        memoryEntries = data.map((entry: any) => ({
          id: entry.id,
          memoryKey: entry.memory_key,
          confidence: entry.confidence,
          summary: entry.summary,
          tags: entry.tags,
          createdAt: entry.created_at,
        }));
      }
      totalMemoryCount = count ?? 0;
    } catch {
      // DB unreachable — render empty memory list
    }
  }

  return (
    <OverviewDashboard
      dashboardMetrics={dashboardMetrics}
      analyticsSeries={analyticsSeries}
      runtimeRules={runtimeRules}
      productPrinciples={productPrinciples}
      memoryEntries={memoryEntries}
      totalMemoryCount={totalMemoryCount}
      budgetSummary={budgetSummary}
    />
  );
}
