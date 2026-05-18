"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Eye,
  Gauge,
  Route,
  ShieldAlert,
  XCircle,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RuntimeRule } from "@/lib/services/runtime-analytics";

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  routing:       { icon: <Route className="h-4 w-4" />,       color: "text-cyan-400",   bg: "rgba(6,182,212,0.10)",  border: "rgba(34,211,238,0.20)" },
  budget:        { icon: <DollarSign className="h-4 w-4" />,  color: "text-amber-400",  bg: "rgba(245,158,11,0.10)", border: "rgba(251,191,36,0.20)" },
  observability: { icon: <Eye className="h-4 w-4" />,         color: "text-violet-400", bg: "rgba(139,92,246,0.10)", border: "rgba(167,139,250,0.20)" },
  cost:          { icon: <DollarSign className="h-4 w-4" />,  color: "text-emerald-400",bg: "rgba(16,185,129,0.10)", border: "rgba(52,211,153,0.20)" },
  latency:       { icon: <Gauge className="h-4 w-4" />,       color: "text-rose-400",   bg: "rgba(244,63,94,0.10)",  border: "rgba(251,113,133,0.20)" },
};

const STATUS_CONFIG = {
  healthy:  { variant: "success" as const,     icon: <CheckCircle2 className="h-3.5 w-3.5" />,  label: "healthy" },
  watch:    { variant: "warning" as const,     icon: <AlertCircle className="h-3.5 w-3.5" />,   label: "watch" },
  breached: { variant: "destructive" as const, icon: <XCircle className="h-3.5 w-3.5" />,       label: "breached" },
};

interface RulesPanelProps {
  rules: RuntimeRule[];
}

export function RulesPanel({ rules }: RulesPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-cyan-400" />
          Cascadeflow rules
        </CardTitle>
        <CardDescription>
          Active guardrails controlling routing, cost, latency, and observability
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {rules.map((rule, i) => {
          const cat = CATEGORY_CONFIG[rule.category] ?? CATEGORY_CONFIG.routing;
          const sta = STATUS_CONFIG[rule.status] ?? STATUS_CONFIG.healthy;
          return (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="flex items-start gap-3 rounded-xl p-3.5"
              style={{ border: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${cat.color}`}
                style={{ background: cat.bg, borderColor: cat.border }}
              >
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-200">{rule.title}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-white tabular-nums">{rule.value}</span>
                    <Badge variant={sta.variant} className="gap-1">
                      {sta.icon}
                      {sta.label}
                    </Badge>
                  </div>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{rule.detail}</p>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
