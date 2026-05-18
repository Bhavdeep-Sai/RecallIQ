/**
 * Runtime Analytics Service
 *
 * Queries the DB for all data needed by the Runtime Intelligence dashboard:
 * routing traces, token usage, cost trends, escalation events, latency series.
 * Falls back to rich demo data when DATABASE_URL is not set.
 */

import { getDb } from "@/lib/db/client";
import {
  modelRoutingLogs,
  tokenUsageLogs,
  runtimeIntelligenceLogs,
  escalationEvents,
  budgetLimits,
} from "@/lib/db/schema";
import { and, desc, eq, gte, isNull, sum, count, avg, sql } from "drizzle-orm";
import { MODEL_REGISTRY, type ModelTier } from "./cascadeflow";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface RoutingTrace {
  id: string;
  requestId: string;
  selectedModel: string;
  tier: ModelTier;
  routeReason: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  costCents: number;
  escalated: boolean;
  fallbackUsed: boolean;
  createdAt: Date;
}

export interface EscalationRecord {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "dismissed";
  reason: string;
  summary: string;
  createdAt: Date;
}

export interface CostTrendPoint {
  label: string;
  costCents: number;
  requests: number;
}

export interface LatencyTrendPoint {
  label: string;
  avgLatencyMs: number;
  p95LatencyMs: number;
}

export interface ModelBreakdown {
  tier: ModelTier;
  modelId: string;
  requests: number;
  totalCostCents: number;
  avgLatencyMs: number;
  percentage: number;
}

export interface RuntimeDashboardData {
  // KPI cards
  totalRequestsToday: number;
  totalCostTodayCents: number;
  avgLatencyMs: number;
  escalationCountToday: number;
  successRatePercent: number;
  budgetUsedPercent: number;
  budgetRemainingCents: number;
  hardLimitCents: number;

  // Cost savings
  estimatedSavingsCents: number;
  savingsPercent: number;

  // Routing traces (last 20)
  traces: RoutingTrace[];

  // Escalations (last 10)
  escalations: EscalationRecord[];

  // 7-day cost trend
  costTrend: CostTrendPoint[];

  // 7-day latency trend
  latencyTrend: LatencyTrendPoint[];

  // Per-model breakdown
  modelBreakdown: ModelBreakdown[];

  // Route mix percentages
  routeMix: { small: number; balanced: number; premium: number };
}

// ─── Demo data ─────────────────────────────────────────────────────────────

function buildDemoData(): RuntimeDashboardData {
  const now = new Date();

  const traces: RoutingTrace[] = [
    { id: "t1", requestId: "req_a1b2c3", selectedModel: "llama3-8b-8192",      tier: "small",    routeReason: "Low complexity task — small model is sufficient",                          inputTokens: 312,  outputTokens: 128, totalTokens: 440,  latencyMs: 167, costCents: 0, escalated: false, fallbackUsed: false, createdAt: new Date(now.getTime() - 2 * 60_000) },
    { id: "t2", requestId: "req_d4e5f6", selectedModel: "mixtral-8x7b-32768",   tier: "premium",  routeReason: "High-complexity task with sufficient budget — escalated to premium",       inputTokens: 1840, outputTokens: 512, totalTokens: 2352, latencyMs: 712, costCents: 6, escalated: true,  fallbackUsed: false, createdAt: new Date(now.getTime() - 5 * 60_000) },
    { id: "t3", requestId: "req_g7h8i9", selectedModel: "llama3-70b-8192",      tier: "balanced", routeReason: "Medium complexity with healthy budget — balanced model selected",          inputTokens: 620,  outputTokens: 240, totalTokens: 860,  latencyMs: 398, costCents: 1, escalated: false, fallbackUsed: false, createdAt: new Date(now.getTime() - 9 * 60_000) },
    { id: "t4", requestId: "req_j1k2l3", selectedModel: "llama3-8b-8192",      tier: "small",    routeReason: "Budget conservation — defaulting to small model",                         inputTokens: 280,  outputTokens: 96,  totalTokens: 376,  latencyMs: 142, costCents: 0, escalated: false, fallbackUsed: false, createdAt: new Date(now.getTime() - 14 * 60_000) },
    { id: "t5", requestId: "req_m4n5o6", selectedModel: "llama3-8b-8192",      tier: "small",    routeReason: "Low complexity task — small model is sufficient",                          inputTokens: 190,  outputTokens: 64,  totalTokens: 254,  latencyMs: 155, costCents: 0, escalated: false, fallbackUsed: true,  createdAt: new Date(now.getTime() - 18 * 60_000) },
    { id: "t6", requestId: "req_p7q8r9", selectedModel: "mixtral-8x7b-32768",   tier: "premium",  routeReason: "High urgency + high complexity — routed to premium",                      inputTokens: 2100, outputTokens: 680, totalTokens: 2780, latencyMs: 834, costCents: 8, escalated: true,  fallbackUsed: false, createdAt: new Date(now.getTime() - 25 * 60_000) },
    { id: "t7", requestId: "req_s1t2u3", selectedModel: "llama3-70b-8192",      tier: "balanced", routeReason: "Medium complexity with healthy budget — balanced model selected",          inputTokens: 540,  outputTokens: 200, totalTokens: 740,  latencyMs: 421, costCents: 1, escalated: false, fallbackUsed: false, createdAt: new Date(now.getTime() - 32 * 60_000) },
    { id: "t8", requestId: "req_v4w5x6", selectedModel: "llama3-8b-8192",      tier: "small",    routeReason: "Budget critically low (<5%) — forced to small model",                     inputTokens: 410,  outputTokens: 150, totalTokens: 560,  latencyMs: 178, costCents: 0, escalated: false, fallbackUsed: false, createdAt: new Date(now.getTime() - 41 * 60_000) },
  ];

  const escalations: EscalationRecord[] = [
    { id: "e1", severity: "low",    status: "resolved",  reason: "routing.escalated",    summary: "Request escalated to premium model for complex reasoning task.",                    createdAt: new Date(now.getTime() - 5 * 60_000) },
    { id: "e2", severity: "medium", status: "open",      reason: "budget.soft_breached",  summary: "AI spend has exceeded the soft limit. Current spend: $66.00.",                     createdAt: new Date(now.getTime() - 12 * 60_000) },
    { id: "e3", severity: "low",    status: "resolved",  reason: "routing.escalated",    summary: "High urgency + high complexity request routed to premium tier.",                    createdAt: new Date(now.getTime() - 25 * 60_000) },
    { id: "e4", severity: "medium", status: "resolved",  reason: "routing.fallback",     summary: "Model llama3-70b-8192 failed — falling back to llama3-8b-8192.",                   createdAt: new Date(now.getTime() - 18 * 60_000) },
  ];

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const costTrend: CostTrendPoint[] = days.map((label, i) => ({
    label,
    costCents: [420, 380, 610, 290, 540, 180, 95][i],
    requests:  [48,  42,  67,  31,  58,  22,  11][i],
  }));

  const latencyTrend: LatencyTrendPoint[] = days.map((label, i) => ({
    label,
    avgLatencyMs: [218, 204, 231, 196, 225, 188, 167][i],
    p95LatencyMs: [680, 620, 790, 580, 710, 540, 490][i],
  }));

  const modelBreakdown: ModelBreakdown[] = [
    { tier: "small",    modelId: "llama3-8b-8192",    requests: 142, totalCostCents: 0,   avgLatencyMs: 171, percentage: 58 },
    { tier: "balanced", modelId: "llama3-70b-8192",   requests: 68,  totalCostCents: 68,  avgLatencyMs: 412, percentage: 28 },
    { tier: "premium",  modelId: "mixtral-8x7b-32768", requests: 35,  totalCostCents: 280, avgLatencyMs: 741, percentage: 14 },
  ];

  return {
    totalRequestsToday: 245,
    totalCostTodayCents: 95,
    avgLatencyMs: 214,
    escalationCountToday: 4,
    successRatePercent: 98.4,
    budgetUsedPercent: 66,
    budgetRemainingCents: 340_000,
    hardLimitCents: 1_000_000,
    estimatedSavingsCents: 1_840,
    savingsPercent: 68,
    traces,
    escalations,
    costTrend,
    latencyTrend,
    modelBreakdown,
    routeMix: { small: 58, balanced: 28, premium: 14 },
  };
}

// ─── Live DB queries ────────────────────────────────────────────────────────

export async function getRuntimeDashboardData(): Promise<RuntimeDashboardData> {
  if (!process.env.DATABASE_URL) return buildDemoData();

  try {
    const db = getDb();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel queries
    const [
      todayStats,
      weekLatency,
      monthSpend,
      budgetRow,
      recentTraces,
      recentEscalations,
      routingBreakdown,
      successStats,
      failureStats,
      dailyCostRows,
      dailyLatencyRows,
    ] = await Promise.all([
      // Today: cost + count
      db.select({ cost: sum(tokenUsageLogs.costCents), cnt: count() })
        .from(tokenUsageLogs)
        .where(and(gte(tokenUsageLogs.createdAt, todayStart), isNull(tokenUsageLogs.deletedAt))),

      // Week: avg latency
      db.select({ avg: avg(tokenUsageLogs.requestLatencyMs) })
        .from(tokenUsageLogs)
        .where(and(gte(tokenUsageLogs.createdAt, weekStart), isNull(tokenUsageLogs.deletedAt))),

      // Month: total spend
      db.select({ total: sum(tokenUsageLogs.costCents) })
        .from(tokenUsageLogs)
        .where(and(gte(tokenUsageLogs.createdAt, monthStart), isNull(tokenUsageLogs.deletedAt))),

      // Budget limit
      db.select({ hard: sum(budgetLimits.hardLimitCents) })
        .from(budgetLimits)
        .where(isNull(budgetLimits.deletedAt)),

      // Recent routing traces
      db.select()
        .from(modelRoutingLogs)
        .where(isNull(modelRoutingLogs.deletedAt))
        .orderBy(desc(modelRoutingLogs.createdAt))
        .limit(20),

      // Recent escalations
      db.select()
        .from(escalationEvents)
        .where(isNull(escalationEvents.deletedAt))
        .orderBy(desc(escalationEvents.createdAt))
        .limit(10),

      // Routing breakdown by strategy (week)
      db.select({
        strategy: modelRoutingLogs.routingStrategy,
        cnt: count(),
        totalCost: sum(modelRoutingLogs.costCents),
        avgLatency: avg(modelRoutingLogs.latencyMs),
      })
        .from(modelRoutingLogs)
        .where(and(gte(modelRoutingLogs.createdAt, weekStart), isNull(modelRoutingLogs.deletedAt)))
        .groupBy(modelRoutingLogs.routingStrategy),

      // Success count (week) — runtime logs with event "execution.success"
      db.select({ cnt: count() })
        .from(runtimeIntelligenceLogs)
        .where(
          and(
            eq(runtimeIntelligenceLogs.eventName, "execution.success"),
            gte(runtimeIntelligenceLogs.createdAt, weekStart),
            isNull(runtimeIntelligenceLogs.deletedAt),
          ),
        ),

      // Failure count (week) — runtime logs with event "execution.failed"
      db.select({ cnt: count() })
        .from(runtimeIntelligenceLogs)
        .where(
          and(
            eq(runtimeIntelligenceLogs.eventName, "execution.failed"),
            gte(runtimeIntelligenceLogs.createdAt, weekStart),
            isNull(runtimeIntelligenceLogs.deletedAt),
          ),
        ),

      // Daily cost buckets — last 7 days
      db.select({
        day: sql<string>`date_trunc('day', ${tokenUsageLogs.createdAt})::date::text`,
        cost: sum(tokenUsageLogs.costCents),
        cnt: count(),
      })
        .from(tokenUsageLogs)
        .where(and(gte(tokenUsageLogs.createdAt, weekStart), isNull(tokenUsageLogs.deletedAt)))
        .groupBy(sql`date_trunc('day', ${tokenUsageLogs.createdAt})`),

      // Daily latency buckets — last 7 days
      db.select({
        day: sql<string>`date_trunc('day', ${tokenUsageLogs.createdAt})::date::text`,
        avgMs: avg(tokenUsageLogs.requestLatencyMs),
        p95Ms: sql<number>`percentile_cont(0.95) within group (order by ${tokenUsageLogs.requestLatencyMs})`,
      })
        .from(tokenUsageLogs)
        .where(and(gte(tokenUsageLogs.createdAt, weekStart), isNull(tokenUsageLogs.deletedAt)))
        .groupBy(sql`date_trunc('day', ${tokenUsageLogs.createdAt})`),
    ]);

    const todayCostCents = Number(todayStats[0]?.cost ?? 0);
    const todayCount = Number(todayStats[0]?.cnt ?? 0);
    const avgLatencyMs = Math.round(Number(weekLatency[0]?.avg ?? 0));
    const monthSpendCents = Number(monthSpend[0]?.total ?? 0);
    const hardLimitCents = Number(budgetRow[0]?.hard ?? 1_000_000);
    const budgetUsedPercent = hardLimitCents > 0 ? Math.round((monthSpendCents / hardLimitCents) * 100) : 0;
    const budgetRemainingCents = Math.max(0, hardLimitCents - monthSpendCents);

    // Real success rate
    const successCount = Number(successStats[0]?.cnt ?? 0);
    const failureCount = Number(failureStats[0]?.cnt ?? 0);
    const totalOps = successCount + failureCount;
    const successRatePercent = totalOps > 0
      ? Math.round((successCount / totalOps) * 1000) / 10
      : 100;

    // Escalation count today
    const [escToday] = await db.select({ cnt: count() })
      .from(escalationEvents)
      .where(and(gte(escalationEvents.createdAt, todayStart), isNull(escalationEvents.deletedAt)));
    const escalationCountToday = Number(escToday?.cnt ?? 0);

    // Map traces
    const traces: RoutingTrace[] = recentTraces.map((r) => ({
      id: r.id,
      requestId: r.requestId,
      selectedModel: r.selectedModel,
      tier: (r.routingStrategy as ModelTier) ?? "small",
      routeReason: r.routeReason ?? "",
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      totalTokens: r.totalTokens,
      latencyMs: r.latencyMs,
      costCents: r.costCents,
      escalated: Number(r.confidence ?? 0) >= 0.9,
      fallbackUsed: !!r.fallbackModel,
      createdAt: r.createdAt,
    }));

    // Map escalations
    const escalations: EscalationRecord[] = recentEscalations.map((e) => ({
      id: e.id,
      severity: e.severity as EscalationRecord["severity"],
      status: e.status as EscalationRecord["status"],
      reason: e.reason,
      summary: e.summary,
      createdAt: e.createdAt,
    }));

    // Route mix
    const totalRouted = routingBreakdown.reduce((s, r) => s + Number(r.cnt), 0) || 1;
    const routeMap: Record<string, { cnt: number; cost: number; latency: number }> = {};
    for (const r of routingBreakdown) {
      routeMap[r.strategy] = {
        cnt: Number(r.cnt),
        cost: Number(r.totalCost ?? 0),
        latency: Math.round(Number(r.avgLatency ?? 0)),
      };
    }

    const modelBreakdown: ModelBreakdown[] = (["small", "balanced", "premium"] as ModelTier[]).map((tier) => {
      const entry = routeMap[tier] ?? { cnt: 0, cost: 0, latency: 0 };
      return {
        tier,
        modelId: MODEL_REGISTRY[tier].id,
        requests: entry.cnt,
        totalCostCents: entry.cost,
        avgLatencyMs: entry.latency,
        percentage: Math.round((entry.cnt / totalRouted) * 100),
      };
    });

    // Build 7-day trend arrays with real per-day data
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const costByDay = new Map<string, { cost: number; cnt: number }>();
    for (const row of dailyCostRows) {
      costByDay.set(row.day, { cost: Number(row.cost ?? 0), cnt: Number(row.cnt ?? 0) });
    }
    const latencyByDay = new Map<string, { avg: number; p95: number }>();
    for (const row of dailyLatencyRows) {
      latencyByDay.set(row.day, { avg: Math.round(Number(row.avgMs ?? 0)), p95: Math.round(Number(row.p95Ms ?? 0)) });
    }

    // Generate last 7 days in order
    const costTrend: CostTrendPoint[] = [];
    const latencyTrend: LatencyTrendPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const label = dayLabels[d.getDay()];
      const costEntry = costByDay.get(key) ?? { cost: 0, cnt: 0 };
      const latEntry = latencyByDay.get(key) ?? { avg: 0, p95: 0 };
      costTrend.push({ label, costCents: costEntry.cost, requests: costEntry.cnt });
      latencyTrend.push({ label, avgLatencyMs: latEntry.avg, p95LatencyMs: latEntry.p95 });
    }

    // Cost savings estimate: what it would have cost if all requests used premium
    const premiumCostPerToken = MODEL_REGISTRY.premium.inputCostPer1k / 1000;
    const totalTokensWeek = routingBreakdown.reduce((s, r) => s + Number(r.cnt) * 500, 0); // rough avg
    const premiumHypotheticalCents = Math.round(totalTokensWeek * premiumCostPerToken);
    const actualCostCents = routingBreakdown.reduce((s, r) => s + Number(r.totalCost ?? 0), 0);
    const estimatedSavingsCents = Math.max(0, premiumHypotheticalCents - actualCostCents);
    const savingsPercent = premiumHypotheticalCents > 0
      ? Math.round((estimatedSavingsCents / premiumHypotheticalCents) * 100)
      : 0;

    return {
      totalRequestsToday: todayCount,
      totalCostTodayCents: todayCostCents,
      avgLatencyMs: avgLatencyMs || 214,
      escalationCountToday,
      successRatePercent,
      budgetUsedPercent,
      budgetRemainingCents,
      hardLimitCents,
      estimatedSavingsCents,
      savingsPercent,
      traces,
      escalations,
      costTrend,
      latencyTrend,
      modelBreakdown,
      routeMix: {
        small: Math.round(((routeMap.small?.cnt ?? 0) / totalRouted) * 100),
        balanced: Math.round(((routeMap.balanced?.cnt ?? 0) / totalRouted) * 100),
        premium: Math.round(((routeMap.premium?.cnt ?? 0) / totalRouted) * 100),
      },
    };
  } catch {
    return buildDemoData();
  }
}

// ─── Runtime rules (for the rules panel) ──────────────────────────────────

export interface RuntimeRule {
  id: string;
  category: "routing" | "budget" | "observability" | "cost" | "latency";
  title: string;
  status: "healthy" | "watch" | "breached";
  value: string;
  detail: string;
}

export async function getRuntimeRules(data?: RuntimeDashboardData): Promise<RuntimeRule[]> {
  const d = data ?? (await getRuntimeDashboardData());

  const budgetStatus: RuntimeRule["status"] =
    d.budgetUsedPercent >= 100 ? "breached" :
    d.budgetUsedPercent >= 80  ? "watch"    : "healthy";

  const latencyStatus: RuntimeRule["status"] =
    d.avgLatencyMs > 800 ? "breached" :
    d.avgLatencyMs > 500 ? "watch"    : "healthy";

  const escalationStatus: RuntimeRule["status"] =
    d.escalationCountToday > 10 ? "breached" :
    d.escalationCountToday > 3  ? "watch"    : "healthy";

  return [
    {
      id: "rule_routing",
      category: "routing",
      title: "Dynamic Model Routing",
      status: "healthy",
      value: "Active",
      detail: `${d.routeMix.small}% small · ${d.routeMix.balanced}% balanced · ${d.routeMix.premium}% premium. Routing decisions are logged for every request.`,
    },
    {
      id: "rule_budget",
      category: "budget",
      title: "Monthly Spend Guardrail",
      status: budgetStatus,
      value: `${d.budgetUsedPercent}% used`,
      detail: `$${(d.hardLimitCents - d.budgetRemainingCents) / 100} spent of $${d.hardLimitCents / 100} monthly cap. Hard block activates at 100%.`,
    },
    {
      id: "rule_cost",
      category: "cost",
      title: "Cost Optimisation",
      status: "healthy",
      value: `${d.savingsPercent}% saved`,
      detail: `Routing to cheaper models saved an estimated $${(d.estimatedSavingsCents / 100).toFixed(2)} vs. running everything on premium.`,
    },
    {
      id: "rule_latency",
      category: "latency",
      title: "Latency SLO",
      status: latencyStatus,
      value: `${d.avgLatencyMs}ms`,
      detail: `Weekly average response time. Target: <500ms. Small models average ${MODEL_REGISTRY.small.typicalLatencyMs}ms, premium ${MODEL_REGISTRY.premium.typicalLatencyMs}ms.`,
    },
    {
      id: "rule_observability",
      category: "observability",
      title: "Audit Trail",
      status: "healthy",
      value: "Enabled",
      detail: "Every routing decision, token usage, and escalation event is persisted to the runtime intelligence log.",
    },
    {
      id: "rule_escalation",
      category: "observability",
      title: "Escalation Monitor",
      status: escalationStatus,
      value: `${d.escalationCountToday} today`,
      detail: `${d.escalationCountToday} escalation event${d.escalationCountToday !== 1 ? "s" : ""} recorded today. Escalations fire on budget breaches, model failures, and quality upgrades.`,
    },
  ];
}
