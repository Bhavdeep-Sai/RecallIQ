"use client";

import { motion } from "framer-motion";
import { DollarSign, TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CostTrendPoint, LatencyTrendPoint } from "@/lib/services/runtime-analytics";

interface CostTrendProps {
  costTrend: CostTrendPoint[];
  latencyTrend: LatencyTrendPoint[];
  estimatedSavingsCents: number;
  savingsPercent: number;
}

export function CostTrendPanel({ costTrend, latencyTrend, estimatedSavingsCents, savingsPercent }: CostTrendProps) {
  const maxCost = Math.max(...costTrend.map((d) => d.costCents), 1);
  const maxLatency = Math.max(...latencyTrend.map((d) => d.p95LatencyMs), 1);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Cost trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            7-day cost trend
          </CardTitle>
          <CardDescription>Daily AI spend in cents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end gap-1.5 h-20">
            {costTrend.map((point, i) => {
              const heightPct = maxCost > 0 ? (point.costCents / maxCost) * 100 : 0;
              return (
                <div key={point.label} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
                    className="w-full rounded-t-sm bg-linear-to-t from-emerald-500/60 to-emerald-400/80 min-h-[2px]"
                    title={`$${(point.costCents / 100).toFixed(2)} · ${point.requests} req`}
                  />
                  <span className="text-[9px] text-slate-600">{point.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 rounded-lg p-2.5"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(52,211,153,0.18)" }}>
            <TrendingDown className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <p className="text-[11px] text-emerald-300">
              Saved <span className="font-bold">${(estimatedSavingsCents / 100).toFixed(2)}</span> ({savingsPercent}%) vs. all-premium routing
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Latency trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="h-4 w-4 flex items-center justify-center text-violet-400 font-bold text-xs">p95</span>
            7-day latency trend
          </CardTitle>
          <CardDescription>P95 response time in ms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end gap-1.5 h-20">
            {latencyTrend.map((point, i) => {
              const avgPct = maxLatency > 0 ? (point.avgLatencyMs / maxLatency) * 100 : 0;
              const p95Pct = maxLatency > 0 ? (point.p95LatencyMs / maxLatency) * 100 : 0;
              return (
                <div key={point.label} className="flex-1 flex flex-col items-center gap-1 relative">
                  {/* P95 bar (background) */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${p95Pct}%` }}
                    transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
                    className="w-full rounded-t-sm bg-violet-500/20 min-h-[2px] absolute bottom-4"
                    title={`p95: ${point.p95LatencyMs}ms`}
                  />
                  {/* Avg bar (foreground) */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${avgPct}%` }}
                    transition={{ delay: i * 0.06 + 0.1, duration: 0.5, ease: "easeOut" }}
                    className="w-full rounded-t-sm bg-linear-to-t from-violet-500/70 to-violet-400/90 min-h-[2px] absolute bottom-4"
                    title={`avg: ${point.avgLatencyMs}ms`}
                  />
                  <span className="text-[9px] text-slate-600 absolute bottom-0">{point.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 pt-1">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-sm bg-violet-400/80" />
              <span className="text-[10px] text-slate-500">avg</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-sm bg-violet-500/30" />
              <span className="text-[10px] text-slate-500">p95</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
