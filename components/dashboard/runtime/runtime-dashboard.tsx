"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  Info,
  RefreshCw,
  Sparkles,
  X,
  GitBranch,
  Clock,
  DollarSign,
  Cpu,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { RuntimeActions } from "@/components/dashboard/actions/runtime-actions";
import { KpiCards } from "./kpi-cards";
import { RoutingTraces } from "./routing-traces";
import { ModelBreakdownPanel } from "./model-breakdown";
import { EscalationFeed } from "./escalation-feed";
import { CostTrendPanel } from "./cost-trend";
import { BudgetGauge } from "./budget-gauge";
import { RulesPanel } from "./rules-panel";
import type { RuntimeDashboardData, RuntimeRule, RoutingTrace } from "@/lib/services/runtime-analytics";

// ─── Types ─────────────────────────────────────────────────────────────────

interface RuntimeDashboardProps {
  data: RuntimeDashboardData;
  rules: RuntimeRule[];
}

interface ApiResponse {
  traces: RuntimeDashboardData["traces"];
  escalations: RuntimeDashboardData["escalations"];
  routeMix: RuntimeDashboardData["routeMix"];
  modelBreakdown: RuntimeDashboardData["modelBreakdown"];
  costTrend: RuntimeDashboardData["costTrend"];
  latencyTrend: RuntimeDashboardData["latencyTrend"];
  kpis: {
    totalRequestsToday: number;
    totalCostTodayCents: number;
    avgLatencyMs: number;
    escalationCountToday: number;
    successRatePercent: number;
    budgetUsedPercent: number;
    budgetRemainingCents: number;
    hardLimitCents: number;
    estimatedSavingsCents: number;
    savingsPercent: number;
  };
  rules: RuntimeRule[];
}

// ─── Fetch helper ──────────────────────────────────────────────────────────

async function fetchRuntimeData(): Promise<ApiResponse> {
  const res = await fetch("/api/runtime/traces", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch runtime data");
  return res.json();
}

function mergeApiResponse(base: RuntimeDashboardData, api: ApiResponse): RuntimeDashboardData {
  return {
    ...base,
    ...api.kpis,
    traces: api.traces,
    escalations: api.escalations,
    routeMix: api.routeMix,
    modelBreakdown: api.modelBreakdown,
    costTrend: api.costTrend,
    latencyTrend: api.latencyTrend,
  };
}

// ─── Trace detail drawer ───────────────────────────────────────────────────

const TIER_COLORS = {
  small:    { text: "text-cyan-400",   bg: "rgba(6,182,212,0.10)",  border: "rgba(34,211,238,0.20)" },
  balanced: { text: "text-violet-400", bg: "rgba(139,92,246,0.10)", border: "rgba(167,139,250,0.20)" },
  premium:  { text: "text-amber-400",  bg: "rgba(245,158,11,0.10)", border: "rgba(251,191,36,0.20)" },
};

function TraceDrawer({ trace, onClose }: { trace: RoutingTrace; onClose: () => void }) {
  const tier = TIER_COLORS[trace.tier] ?? TIER_COLORS.small;

  return (
    <AnimatePresence>
      <motion.div
        key="drawer-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.aside
        key="drawer-panel"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col"
        style={{
          background: "var(--bg-overlay)",
          borderLeft: "1px solid var(--border-default)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Trace detail</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Request ID */}
          <div>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-faint)" }}>Request ID</p>
            <p className="text-sm font-mono" style={{ color: "var(--text-primary)" }}>{trace.requestId}</p>
          </div>

          {/* Model selected */}
          <div
            className="rounded-xl p-4 space-y-1"
            style={{ background: tier.bg, border: `1px solid ${tier.border}` }}
          >
            <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Selected model</p>
            <p className={`text-base font-bold ${tier.text}`}>{trace.selectedModel}</p>
            <p className="text-[11px] capitalize" style={{ color: "var(--text-muted)" }}>{trace.tier} tier</p>
          </div>

          {/* Why it was selected */}
          <div>
            <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Why this model was selected</p>
            <div className="rounded-xl p-3.5" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{trace.routeReason}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            {trace.escalated && (
              <Badge variant="warning" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Escalated to premium
              </Badge>
            )}
            {trace.fallbackUsed && (
              <Badge variant="secondary" className="gap-1">
                <RefreshCw className="h-3 w-3" />
                Fallback used
              </Badge>
            )}
            {!trace.escalated && !trace.fallbackUsed && (
              <Badge variant="success" className="gap-1">
                Optimal route
              </Badge>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <DrawerStat
              icon={<Cpu className="h-3.5 w-3.5 text-cyan-400" />}
              label="Input tokens"
              value={trace.inputTokens.toLocaleString()}
            />
            <DrawerStat
              icon={<Cpu className="h-3.5 w-3.5 text-violet-400" />}
              label="Output tokens"
              value={trace.outputTokens.toLocaleString()}
            />
            <DrawerStat
              icon={<Cpu className="h-3.5 w-3.5 text-slate-400" />}
              label="Total tokens"
              value={trace.totalTokens.toLocaleString()}
            />
            <DrawerStat
              icon={<Clock className="h-3.5 w-3.5 text-amber-400" />}
              label="Latency"
              value={`${trace.latencyMs}ms`}
            />
            <DrawerStat
              icon={<DollarSign className="h-3.5 w-3.5 text-emerald-400" />}
              label="Cost"
              value={trace.costCents === 0 ? "Free" : `$${(trace.costCents / 100).toFixed(4)}`}
            />
            <DrawerStat
              icon={<Clock className="h-3.5 w-3.5 text-slate-400" />}
              label="Timestamp"
              value={new Date(trace.createdAt).toLocaleTimeString()}
            />
          </div>

          {/* Cost breakdown */}
          <div>
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-faint)" }}>Cost breakdown</p>
            <div className="rounded-xl p-3.5 space-y-2" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
              <CostRow label="Input tokens" tokens={trace.inputTokens} tier={trace.tier} type="input" />
              <CostRow label="Output tokens" tokens={trace.outputTokens} tier={trace.tier} type="output" />
              <div className="pt-2 mt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <div className="flex justify-between">
                  <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Total</span>
                  <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                    {trace.costCents === 0 ? "Free" : `$${(trace.costCents / 100).toFixed(4)}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

function DrawerStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>{label}</span></div>
      <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

const TIER_RATES = {
  small:    { input: 5,   output: 8   },
  balanced: { input: 59,  output: 79  },
  premium:  { input: 240, output: 240 },
};

function CostRow({ label, tokens, tier, type }: { label: string; tokens: number; tier: string; type: "input" | "output" }) {
  const rates = TIER_RATES[tier as keyof typeof TIER_RATES] ?? TIER_RATES.small;
  const rate = type === "input" ? rates.input : rates.output;
  // micro-cents → cents
  const costCents = (tokens / 1000) * rate / 100;
  return (
    <div className="flex justify-between text-xs">
      <span style={{ color: "var(--text-muted)" }}>{label} ({tokens.toLocaleString()} × ${(rate / 100_000).toFixed(5)}/tok)</span>
      <span className="tabular-nums" style={{ color: "var(--text-primary)" }}>{costCents < 0.0001 ? "< $0.0001" : `$${costCents.toFixed(4)}`}</span>
    </div>
  );
}

// ─── Main dashboard ────────────────────────────────────────────────────────

export function RuntimeDashboard({ data: initialData, rules: initialRules }: RuntimeDashboardProps) {
  const [selectedTrace, setSelectedTrace] = useState<RoutingTrace | null>(null);

  // Poll every 30 seconds for live updates
  const { data: apiData, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["runtime-dashboard"],
    queryFn: fetchRuntimeData,
    refetchInterval: 30_000,
    staleTime: 15_000,
    // Don't throw on error — fall back to SSR data
    throwOnError: false,
  });

  const data: RuntimeDashboardData = apiData
    ? mergeApiResponse(initialData, apiData)
    : initialData;

  const rules: RuntimeRule[] = apiData?.rules ?? initialRules;

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString()
    : null;

  const handleTraceClick = useCallback((trace: RoutingTrace) => {
    setSelectedTrace(trace);
  }, []);

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          icon={<Sparkles className="h-5 w-5" />}
          badge="Cascadeflow runtime"
          title="Runtime Intelligence"
          description="Optimize model routing, cost, latency, and budget enforcement without losing observability or control."
          actions={
            <>
              <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
                {isFetching ? (
                  <RefreshCw className="h-3 w-3 animate-spin text-cyan-400" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 status-dot inline-block" />
                )}
                {lastUpdated ? `Updated ${lastUpdated}` : "Live"}
              </div>
              <RuntimeActions />
            </>
          }
        />

        {/* Explainer */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-xl p-4 flex gap-3"
          style={{ background: "var(--info-bg)", border: "1px solid var(--info-border)" }}
        >
          <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--info-text)" }} />
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>What is Runtime Intelligence? </span>
            RecallIQ uses multiple AI models. This page shows every routing decision — which model was chosen, why, how many tokens were used, what it cost, and whether the budget guardrail was triggered. Simple tasks use cheap models automatically; complex reasoning escalates to premium only when needed.
          </p>
        </motion.div>

        {/* KPI strip */}
        <KpiCards data={data} />

        {/* Cost + latency trends */}
        <CostTrendPanel
          costTrend={data.costTrend}
          latencyTrend={data.latencyTrend}
          estimatedSavingsCents={data.estimatedSavingsCents}
          savingsPercent={data.savingsPercent}
        />

        {/* Main grid: traces + right column */}
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          {/* Routing traces — full audit trail */}
          <RoutingTraces traces={data.traces} onTraceClick={handleTraceClick} />

          {/* Right column */}
          <div className="space-y-6">
            <BudgetGauge data={data} />
            <EscalationFeed escalations={data.escalations} />
          </div>
        </div>

        {/* Bottom grid: rules + model breakdown */}
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <RulesPanel rules={rules} />
          <ModelBreakdownPanel breakdown={data.modelBreakdown} routeMix={data.routeMix} />
        </div>
      </div>

      {/* Trace detail drawer */}
      {selectedTrace && (
        <TraceDrawer trace={selectedTrace} onClose={() => setSelectedTrace(null)} />
      )}
    </>
  );
}
