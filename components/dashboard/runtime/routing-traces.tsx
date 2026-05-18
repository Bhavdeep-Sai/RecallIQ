"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  GitBranch,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/format";
import type { RoutingTrace } from "@/lib/services/runtime-analytics";

const TIER_CONFIG = {
  small: {
    label: "Small",
    color: "text-cyan-400",
    bg: "rgba(6,182,212,0.10)",
    border: "rgba(34,211,238,0.20)",
    dot: "bg-cyan-400",
  },
  balanced: {
    label: "Balanced",
    color: "text-violet-400",
    bg: "rgba(139,92,246,0.10)",
    border: "rgba(167,139,250,0.20)",
    dot: "bg-violet-400",
  },
  premium: {
    label: "Premium",
    color: "text-amber-400",
    bg: "rgba(245,158,11,0.10)",
    border: "rgba(251,191,36,0.20)",
    dot: "bg-amber-400",
  },
};

interface RoutingTracesProps {
  traces: RoutingTrace[];
  onTraceClick?: (trace: RoutingTrace) => void;
}

export function RoutingTraces({ traces, onTraceClick }: RoutingTracesProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-cyan-400" />
              Routing traces
            </CardTitle>
            <CardDescription className="mt-1">
              Every AI request — model selected, why, tokens used, cost, latency
            </CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 status-dot" />
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {traces.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center px-5">
            <div className="h-10 w-10 rounded-xl border flex items-center justify-center"
              style={{ background: "var(--bg-subtle)", borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
              <GitBranch className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted">No traces yet — run an AI operation to see routing decisions here.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {traces.map((trace, i) => {
              const tier = TIER_CONFIG[trace.tier] ?? TIER_CONFIG.small;
              return (
                <motion.div
                  key={trace.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="flex items-start gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors cursor-pointer"
                  onClick={() => onTraceClick?.(trace)}
                >
                  {/* Tier badge */}
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border mt-0.5"
                    style={{ background: tier.bg, borderColor: tier.border }}
                  >
                    <span className={`h-2 w-2 rounded-full ${tier.dot}`} />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-slate-400">{trace.requestId}</span>
                      <span className={`text-[11px] font-semibold ${tier.color}`}>{tier.label}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{trace.selectedModel}</span>
                      {trace.escalated && (
                        <Badge variant="warning" className="gap-1 text-[10px] px-1.5 py-0">
                          <Sparkles className="h-2.5 w-2.5" />
                          escalated
                        </Badge>
                      )}
                      {trace.fallbackUsed && (
                        <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0">
                          <RefreshCw className="h-2.5 w-2.5" />
                          fallback
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 line-clamp-1">
                      {trace.routeReason}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div className="hidden sm:block">
                      <p className="text-[11px] text-slate-500">tokens</p>
                      <p className="text-xs font-semibold text-slate-300 tabular-nums">{trace.totalTokens.toLocaleString()}</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-[11px] text-slate-500">latency</p>
                      <p className="text-xs font-semibold text-slate-300 tabular-nums">{trace.latencyMs}ms</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">cost</p>
                      <p className="text-xs font-semibold text-slate-300 tabular-nums">
                        {trace.costCents === 0 ? "free" : `$${(trace.costCents / 100).toFixed(3)}`}
                      </p>
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-[11px] text-slate-500 text-right">{formatRelativeTime(trace.createdAt)}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600 shrink-0 hidden lg:block" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
