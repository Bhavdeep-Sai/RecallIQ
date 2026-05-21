import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  Clock,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/dashboard/page-header";
import { AnalyticsActions } from "@/components/dashboard/actions/analytics-actions";
import { getAnalyticsSeries, getBudgetSummary, getDashboardMetrics } from "@/lib/services/analytics";
import { formatCompactNumber, formatCurrency, formatPercent } from "@/lib/format";

const metricIcons = [DollarSign, Users, Activity, Clock];
const metricColors = [
  "from-cyan-500/20 to-cyan-500/5 border-cyan-400/15 text-cyan-400",
  "from-violet-500/20 to-violet-500/5 border-violet-400/15 text-violet-400",
  "from-emerald-500/20 to-emerald-500/5 border-emerald-400/15 text-emerald-400",
  "from-amber-500/20 to-amber-500/5 border-amber-400/15 text-amber-400",
];

const takeaways = [
  {
    icon: <TrendingUp className="h-4 w-4 text-emerald-400" />,
    text: "Revenue at risk is decreasing as memory-backed follow-ups sharpen objection handling.",
    tag: "Positive trend",
    tagVariant: "success" as const,
  },
  {
    icon: <DollarSign className="h-4 w-4 text-cyan-400" />,
    text: "Runtime routing is pushing more short responses to efficient models, keeping spend in check.",
    tag: "Cost savings",
    tagVariant: "default" as const,
  },
  {
    icon: <Activity className="h-4 w-4 text-violet-400" />,
    text: "The system maintains sub-300ms latency while preserving traceability across memory writes.",
    tag: "Performance",
    tagVariant: "secondary" as const,
  },
  {
    icon: <Clock className="h-4 w-4 text-amber-400" />,
    text: "Pricing pressure remains the dominant deal risk and should be surfaced in the sales cockpit.",
    tag: "Action needed",
    tagVariant: "warning" as const,
  },
];

export default async function AnalyticsPage() {
  const dashboardMetrics = await getDashboardMetrics();
  const analyticsSeries = await getAnalyticsSeries();
  const budgetSummary = await getBudgetSummary();
  const maxValue = Math.max(...analyticsSeries.map((p: any) => p.value), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<BarChart3 className="h-5 w-5" />}
        badge="Business analytics"
        title="Analytics"
        description="Monitor adoption, memory usage, revenue lift, and operating efficiency in one executive view."
        helpTitle="Reading this page"
        helpText="The metric cards at the top show the key numbers. The activity chart shows movement over time, and the takeaways section highlights what is going well and what needs attention. Use this page to spot trends in adoption, spend, and operational performance."
        actions={<AnalyticsActions />}
      />

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric, i) => {
          const Icon = metricIcons[i] ?? Activity;
          const color = metricColors[i] ?? metricColors[0];
          return (
            <Card key={metric.label}>
              <CardContent className="p-5">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br border mb-3 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold text-white">{metric.value}</p>
                <p className="text-xs text-slate-400 mt-0.5 mb-3">{metric.label}</p>
                <Badge variant={metric.delta?.startsWith("+") ? "success" : "secondary"}>
                  {metric.delta}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts + takeaways */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">

        {/* Weekly trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              Weekly trend
            </CardTitle>
            <CardDescription>Conversation and AI operations over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsSeries.map((point: any) => {
              const pct = maxValue > 0 ? Math.round((point.value / maxValue) * 100) : 0;
              return (
                <div key={point.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 font-medium w-8">{point.label}</span>
                    <div className="flex-1 mx-3">
                      <div className="h-2.5 rounded-full bg-white/6 overflow-hidden">
                        {pct > 0 && (
                          <div
                            className="h-2.5 rounded-full bg-linear-to-r from-cyan-400 to-violet-400 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        )}
                      </div>
                    </div>
                    <span className="text-slate-300 font-semibold tabular-nums w-8 text-right">
                      {formatCompactNumber(point.value)}
                    </span>
                  </div>
                </div>
              );
            })}

            <Separator className="mt-2" />

            <div className="grid grid-cols-3 gap-3 pt-1">
              <SummaryTile label="Total events" value={formatCompactNumber(analyticsSeries.reduce((a: number, p: any) => a + p.value, 0))} />
              <SummaryTile label="Monthly spend" value={budgetSummary.monthlySpend !== null ? formatCurrency(budgetSummary.monthlySpend) : "—"} />
              <SummaryTile label="Budget used" value={budgetSummary.budgetUsed !== null ? formatPercent(budgetSummary.budgetUsed) : "—"} />
            </div>
          </CardContent>
        </Card>

        {/* Executive takeaways */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              Key takeaways
            </CardTitle>
            <CardDescription>What leadership should know this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {takeaways.map((item, i) => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-3.5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <Badge variant={item.tagVariant}>{item.tag}</Badge>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">{item.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-3 text-center">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">{label}</p>
      <p className="mt-1.5 text-sm font-bold text-white">{value}</p>
    </div>
  );
}
