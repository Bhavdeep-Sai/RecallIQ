"use client";

import { motion } from "framer-motion";
import { DollarSign, ShieldCheck, TrendingDown, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RuntimeDashboardData } from "@/lib/services/runtime-analytics";

interface BudgetGaugeProps {
  data: RuntimeDashboardData;
}

export function BudgetGauge({ data }: BudgetGaugeProps) {
  const pct = Math.min(100, data.budgetUsedPercent);
  const spentDollars = (data.hardLimitCents - data.budgetRemainingCents) / 100;
  const limitDollars = data.hardLimitCents / 100;
  const remainingDollars = data.budgetRemainingCents / 100;

  const barColor =
    pct >= 100 ? "from-rose-500 to-rose-400" :
    pct >= 80  ? "from-amber-500 to-amber-400" :
    pct >= 60  ? "from-yellow-500 to-yellow-400" :
                 "from-emerald-500 to-emerald-400";
  // barColor used with bg-linear-to-r

  const statusVariant: "destructive" | "warning" | "success" =
    pct >= 100 ? "destructive" :
    pct >= 80  ? "warning"     : "success";

  const statusLabel =
    pct >= 100 ? "Breached" :
    pct >= 80  ? "Watch"    : "Healthy";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              Budget enforcement
            </CardTitle>
            <CardDescription className="mt-1">Monthly AI spend vs. hard cap</CardDescription>
          </div>
          <Badge variant={statusVariant} className="gap-1 shrink-0">
            <ShieldCheck className="h-3 w-3" />
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Gauge bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">$0</span>
            <span className="font-semibold text-white">{pct}% used</span>
            <span className="text-slate-400">${limitDollars.toLocaleString()}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-3 rounded-full bg-linear-to-r ${barColor}`}
            />
          </div>
          {/* Soft limit marker */}
          <div className="relative h-0">
            <div
              className="absolute top-0 h-3 w-0.5 bg-amber-400/60 -translate-y-3"
              style={{ left: "80%" }}
              title="Soft limit (80%)"
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <BudgetStat
            icon={<DollarSign className="h-3.5 w-3.5 text-rose-400" />}
            label="Spent"
            value={`$${spentDollars.toFixed(2)}`}
          />
          <BudgetStat
            icon={<DollarSign className="h-3.5 w-3.5 text-emerald-400" />}
            label="Remaining"
            value={`$${remainingDollars.toFixed(0)}`}
          />
          <BudgetStat
            icon={<TrendingDown className="h-3.5 w-3.5 text-cyan-400" />}
            label="Saved"
            value={`$${(data.estimatedSavingsCents / 100).toFixed(2)}`}
          />
        </div>

        {/* Routing impact */}
        <div className="rounded-xl p-3 space-y-2.5"
          style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
          <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Routing impact</p>
          {(["small", "balanced", "premium"] as const).map((tier) => {
            const colors = {
              small:    { bar: "bg-cyan-400",   text: "text-cyan-400" },
              balanced: { bar: "bg-violet-400", text: "text-violet-400" },
              premium:  { bar: "bg-amber-400",  text: "text-amber-400" },
            };
            const c = colors[tier];
            const pctVal = data.routeMix[tier];
            return (
              <div key={tier} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 capitalize">{tier}</span>
                  <span className={`font-semibold ${c.text}`}>{pctVal}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pctVal}%` }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                    className={`h-1.5 rounded-full ${c.bar}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function BudgetStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl p-2.5 text-center"
      style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-sm font-bold text-white tabular-nums">{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
