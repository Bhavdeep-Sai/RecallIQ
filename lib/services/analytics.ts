/**
 * Data provider for dashboard metrics and analytics.
 * Uses the Supabase REST API (via service role key) for all queries
 * to avoid Transaction Pooler connection issues.
 */

import { getSupabaseAdmin } from "@/lib/db/client";

// ─── Formatters ────────────────────────────────────────────────────────────

export type TimePoint = { ts: string; value: number };

// ─── Dashboard metrics ─────────────────────────────────────────────────────

export async function getDashboardMetrics() {
  const NO_DB = [
    { label: "Active accounts",  value: "—", delta: "—", note: "Database not connected" },
    { label: "Conversations",    value: "—", delta: "—", note: "Database not connected" },
    { label: "Runtime AI cost",  value: "—", delta: "—", note: "Database not connected" },
    { label: "Median latency",   value: "—", delta: "—", note: "Database not connected" },
  ];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NO_DB;

  try {
    const supabase = getSupabaseAdmin();

    const [{ count: custCount }, { count: convCount }, { data: costData }, { data: latData }] =
      await Promise.all([
        supabase.from("customers").select("*", { count: "exact", head: true }).is("deleted_at", null),
        supabase.from("conversations").select("*", { count: "exact", head: true }).is("deleted_at", null),
        supabase.from("token_usage_logs").select("cost_cents").is("deleted_at", null),
        supabase.from("token_usage_logs").select("request_latency_ms").is("deleted_at", null),
      ]);

    const totalCostCents = (costData ?? []).reduce((s: number, r: any) => s + (r.cost_cents ?? 0), 0);
    const totalCostDollars = totalCostCents / 100;
    const latencies = (latData ?? []).map((r: any) => r.request_latency_ms ?? 0).filter(Boolean);
    const avgLatency = latencies.length ? Math.round(latencies.reduce((a: number, b: number) => a + b, 0) / latencies.length) : 0;

    return [
      { label: "Active accounts",  value: String(custCount ?? 0), delta: "+0", note: `${convCount ?? 0} conversation${convCount !== 1 ? "s" : ""} tracked` },
      { label: "Conversations",    value: String(convCount ?? 0), delta: "+0", note: "Total conversations in the system" },
      { label: "Runtime AI cost",  value: totalCostDollars > 0 ? `$${totalCostDollars.toFixed(2)}` : "$0.00", delta: "0%", note: "Total spend on AI operations" },
      { label: "Median latency",   value: avgLatency > 0 ? `${avgLatency}ms` : "—", delta: "0ms", note: "Average latency across AI operations" },
    ];
  } catch {
    return NO_DB;
  }
}

// ─── Weekly activity series ─────────────────────────────────────────────────

export async function getAnalyticsSeries() {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const emptyDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return { label: dayNames[d.getDay()], value: 0 };
  });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return emptyDays;

  try {
    const supabase = getSupabaseAdmin();
    const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString();

    const { data, error } = await supabase
      .from("conversations")
      .select("created_at")
      .is("deleted_at", null)
      .gte("created_at", sevenDaysAgo);

    if (error) throw error;

    // Count per day
    const byDay = new Map<string, number>();
    for (const row of data ?? []) {
      const key = (row as any).created_at.slice(0, 10); // YYYY-MM-DD
      byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86400000);
      const key = d.toISOString().slice(0, 10);
      return { label: dayNames[d.getDay()], value: byDay.get(key) ?? 0 };
    });
  } catch {
    return emptyDays;
  }
}

// ─── Budget summary ─────────────────────────────────────────────────────────

export async function getBudgetSummary() {
  const empty = { monthlySpend: null, budgetUsed: null, hasData: false };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return empty;

  try {
    const supabase = getSupabaseAdmin();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [{ data: spendData }, { data: limitData }] = await Promise.all([
      supabase.from("token_usage_logs").select("cost_cents").is("deleted_at", null).gte("created_at", monthStart),
      supabase.from("budget_limits").select("hard_limit_cents").is("deleted_at", null).eq("active", true),
    ]);

    const spendCents = (spendData ?? []).reduce((s: number, r: any) => s + (r.cost_cents ?? 0), 0);
    const limitCents = (limitData ?? []).reduce((s: number, r: any) => s + (r.hard_limit_cents ?? 0), 0);

    return {
      monthlySpend: spendCents / 100,
      budgetUsed: limitCents > 0 ? spendCents / limitCents : null,
      hasData: true,
    };
  } catch {
    return empty;
  }
}

// ─── Placeholder series used by older analytics sub-charts ─────────────────

function daysAgoPoints(days = 30, base = 50, variance = 20) {
  return Array.from({ length: days }, (_, i) => {
    const ts = new Date(Date.now() - (days - i) * 86400000).toISOString().slice(0, 10);
    return { ts, value: Math.max(0, base + Math.round((Math.random() - 0.5) * variance)) };
  });
}

export async function getAICostSeries()           { return daysAgoPoints(30, 120, 50); }
export async function getRuntimePerformance()     { return daysAgoPoints(30, 200, 80); }
export async function getLatencyMetrics()         { return daysAgoPoints(30, 350, 150); }
export async function getMemoryEffectiveness()    { return daysAgoPoints(30, 60, 20); }
export async function getConversationQuality()    { return daysAgoPoints(30, 70, 30); }
export async function getCustomerEngagement()     { return daysAgoPoints(30, 40, 30); }
export async function getEscalationFrequency()    { return daysAgoPoints(30, 5, 6); }
export async function getBudgetConsumption()      { return daysAgoPoints(30, 30, 20); }
export async function getPersonalizationImprovement() { return daysAgoPoints(30, 55, 25); }
export async function getModelUsage() {
  return [
    { name: "llama3-8b-8192", value: 420 },
    { name: "llama3-70b-8192", value: 210 },
    { name: "mixtral-8x7b-32768", value: 90 },
  ];
}

export async function getAnalyticsOverview() {
  return {
    aiCost: await getAICostSeries(),
    runtimePerf: await getRuntimePerformance(),
    latency: await getLatencyMetrics(),
    memoryEffectiveness: await getMemoryEffectiveness(),
    conversationQuality: await getConversationQuality(),
    engagement: await getCustomerEngagement(),
    escalations: await getEscalationFrequency(),
    modelUsage: await getModelUsage(),
    budget: await getBudgetConsumption(),
    personalization: await getPersonalizationImprovement(),
    generatedAt: new Date().toISOString(),
  };
}

export { getRuntimeRules } from "./runtime-analytics";

export const productPrinciples = [
  "Persistent memory across customer sessions — no context lost between calls",
  "Budget-aware model routing with hard and soft spend guardrails",
  "Observable, auditable runtime decisions with full trace logs",
  "Fast enterprise UX — sub-300ms p50 latency with intelligent escalation",
];
