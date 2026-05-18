"use client";

import { motion } from "framer-motion";
import { Route } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ModelBreakdown, RuntimeDashboardData } from "@/lib/services/runtime-analytics";

const TIER_STYLES = {
  small: {
    label: "Small / fast",
    gradient: "from-cyan-400 to-cyan-300",
    text: "text-cyan-400",
    bg: "rgba(6,182,212,0.10)",
    border: "rgba(34,211,238,0.20)",
    glow: "rgba(34,211,238,0.15)",
  },
  balanced: {
    label: "Balanced",
    gradient: "from-violet-400 to-violet-300",
    text: "text-violet-400",
    bg: "rgba(139,92,246,0.10)",
    border: "rgba(167,139,250,0.20)",
    glow: "rgba(167,139,250,0.15)",
  },
  premium: {
    label: "Premium / large",
    gradient: "from-amber-400 to-amber-300",
    text: "text-amber-400",
    bg: "rgba(245,158,11,0.10)",
    border: "rgba(251,191,36,0.20)",
    glow: "rgba(251,191,36,0.15)",
  },
};

interface ModelBreakdownPanelProps {
  breakdown: ModelBreakdown[];
  routeMix: RuntimeDashboardData["routeMix"];
}

export function ModelBreakdownPanel({ breakdown, routeMix }: ModelBreakdownPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-4 w-4 text-cyan-400" />
          Model routing behaviour
        </CardTitle>
        <CardDescription>
          How requests are distributed across model tiers this week
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Stacked bar */}
        <div className="space-y-1.5">
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {(["small", "balanced", "premium"] as const).map((tier) => {
              const pct = routeMix[tier];
              const s = TIER_STYLES[tier];
              return pct > 0 ? (
                <motion.div
                  key={tier}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
                  className={`h-3 bg-linear-to-r ${s.gradient} first:rounded-l-full last:rounded-r-full`}
                  title={`${s.label}: ${pct}%`}
                />
              ) : null;
            })}
          </div>
          <div className="flex gap-4 flex-wrap">
            {(["small", "balanced", "premium"] as const).map((tier) => {
              const s = TIER_STYLES[tier];
              return (
                <div key={tier} className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full bg-linear-to-r ${s.gradient}`} />
                  <span className="text-[11px] text-slate-400">{s.label}</span>
                  <span className={`text-[11px] font-semibold ${s.text}`}>{routeMix[tier]}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-model rows */}
        <div className="space-y-3">
          {breakdown.map((item, i) => {
            const s = TIER_STYLES[item.tier];
            return (
              <motion.div
                key={item.tier}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                className="rounded-xl p-3.5"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className={`text-sm font-semibold ${s.text}`}>{s.label}</p>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">{item.modelId}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">{item.requests.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500">requests</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <Stat label="Avg latency" value={`${item.avgLatencyMs}ms`} />
                  <Stat label="Total cost" value={item.totalCostCents === 0 ? "free" : `$${(item.totalCostCents / 100).toFixed(2)}`} />
                  <Stat label="Share" value={`${item.percentage}%`} />
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Routing more requests to small models reduces cost while maintaining quality for simple tasks. Premium is reserved for complex reasoning.
        </p>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-xs font-semibold text-slate-300 mt-0.5 tabular-nums">{value}</p>
    </div>
  );
}
