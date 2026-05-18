"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingDown,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RuntimeDashboardData } from "@/lib/services/runtime-analytics";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

interface KpiCardsProps {
  data: RuntimeDashboardData;
}

export function KpiCards({ data }: KpiCardsProps) {
  const cards = [
    {
      label: "Requests today",
      value: data.totalRequestsToday.toLocaleString(),
      sub: "AI operations processed",
      icon: <Activity className="h-4 w-4" />,
      color: "cyan",
      badge: null,
    },
    {
      label: "Cost today",
      value: `$${(data.totalCostTodayCents / 100).toFixed(2)}`,
      sub: `${data.savingsPercent}% saved vs. all-premium`,
      icon: <DollarSign className="h-4 w-4" />,
      color: "emerald",
      badge: data.savingsPercent > 0 ? `−${data.savingsPercent}%` : null,
    },
    {
      label: "Avg latency",
      value: `${data.avgLatencyMs}ms`,
      sub: "7-day rolling average",
      icon: <Clock className="h-4 w-4" />,
      color: data.avgLatencyMs > 500 ? "amber" : "violet",
      badge: data.avgLatencyMs > 500 ? "slow" : null,
    },
    {
      label: "Success rate",
      value: `${data.successRatePercent}%`,
      sub: "Requests completed without error",
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "emerald",
      badge: null,
    },
    {
      label: "Budget used",
      value: `${data.budgetUsedPercent}%`,
      sub: `$${(data.budgetRemainingCents / 100).toFixed(0)} remaining`,
      icon: <Zap className="h-4 w-4" />,
      color: data.budgetUsedPercent >= 80 ? "amber" : "cyan",
      badge: data.budgetUsedPercent >= 80 ? "watch" : null,
    },
    {
      label: "Escalations",
      value: String(data.escalationCountToday),
      sub: "Events today",
      icon: <AlertTriangle className="h-4 w-4" />,
      color: data.escalationCountToday > 3 ? "amber" : "violet",
      badge: null,
    },
    {
      label: "Cost savings",
      value: `$${(data.estimatedSavingsCents / 100).toFixed(2)}`,
      sub: "vs. all-premium baseline",
      icon: <TrendingDown className="h-4 w-4" />,
      color: "emerald",
      badge: "this week",
    },
  ];

  const colorMap: Record<string, { text: string; bg: string; border: string }> = {
    cyan:    { text: "#22d3ee", bg: "rgba(6,182,212,0.10)",   border: "rgba(34,211,238,0.20)" },
    violet:  { text: "#a78bfa", bg: "rgba(139,92,246,0.10)",  border: "rgba(167,139,250,0.20)" },
    emerald: { text: "#34d399", bg: "rgba(16,185,129,0.10)",  border: "rgba(52,211,153,0.20)" },
    amber:   { text: "#fbbf24", bg: "rgba(245,158,11,0.10)",  border: "rgba(251,191,36,0.20)" },
    rose:    { text: "#fb7185", bg: "rgba(244,63,94,0.10)",   border: "rgba(251,113,133,0.20)" },
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {cards.map((card, i) => {
        const c = colorMap[card.color] ?? colorMap.cyan;
        return (
          <motion.div key={card.label} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
            <Card className="h-full">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg border"
                    style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
                  >
                    {card.icon}
                  </div>
                  {card.badge && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 shrink-0">
                      {card.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xl font-bold text-primary tabular-nums">{card.value}</p>
                <p className="text-[11px] font-medium mt-0.5" style={{ color: c.text }}>{card.label}</p>
                <p className="text-[10px] mt-1 leading-relaxed text-muted">{card.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
