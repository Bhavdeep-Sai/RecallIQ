"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BrainCircuit,
  Gauge,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
  Activity,
  Users,
  MessageSquare,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RecommendationCard from "@/components/dashboard/recommendation-card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatCompactNumber, formatPercent, formatRelativeTime } from "@/lib/format";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: "easeOut" as const },
  }),
};

const metricIcons = [DollarSign, Users, Activity, Clock];

export function OverviewDashboard({
  dashboardMetrics,
  analyticsSeries,
  runtimeRules,
  productPrinciples,
  memoryEntries,
  totalMemoryCount,
  budgetSummary,
}: {
  dashboardMetrics: any[];
  analyticsSeries: any[];
  runtimeRules: any[];
  productPrinciples: string[];
  memoryEntries: any[];
  totalMemoryCount: number;
  budgetSummary: { monthlySpend: number | null; budgetUsed: number | null; hasData: boolean };
}) {
  return (
    <div className="space-y-6">

      {/* ── Hero banner ── */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Background glow blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl" style={{ background: "rgba(34,197,94,0.08)" }} />
          <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full blur-3xl" style={{ background: "rgba(16,185,129,0.06)" }} />
        </div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" dot>Recall Memory Core</Badge>
              <Badge variant="success" dot>All systems healthy</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl leading-tight" style={{ color: "var(--text-primary)" }}>
              Your AI-powered{" "}
              <span className="gradient-text">sales memory</span>{" "}
              is active
            </h1>
            <p className="text-base leading-relaxed max-w-lg" style={{ color: "var(--text-secondary)" }}>
              RecallIQ remembers every objection, pricing concern, and customer signal — so your team always picks up exactly where they left off.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/ai-memory">
                <Button variant="gradient">
                  <Sparkles className="h-4 w-4" />
                  Explore memory
                </Button>
              </Link>
              <Link href="/runtime-intelligence">
                <Button variant="secondary">
                  <BrainCircuit className="h-4 w-4" />
                  View intelligence layer
                </Button>
              </Link>
            </div>
          </div>

          {/* Status grid */}
          <div className="grid grid-cols-2 gap-3 min-w-[260px]">
            <StatusChip icon={<ShieldCheck className="h-4 w-4" />} label="Guardrails" value="Active" color="cyan" />
            <StatusChip
              icon={<Gauge className="h-4 w-4" />}
              label="Latency"
              value={runtimeRules.find(r => r.id === "rule_latency")?.value ?? "—"}
              color="violet"
            />
            <StatusChip icon={<TrendingUp className="h-4 w-4" />} label="Memory entries" value={String(totalMemoryCount)} color="emerald" />
            <StatusChip
              icon={<Zap className="h-4 w-4" />}
              label="Budget used"
              value={budgetSummary.budgetUsed !== null ? formatPercent(budgetSummary.budgetUsed) : "—"}
              color="amber"
            />
          </div>
        </div>
      </motion.div>

      {/* ── Metric cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric, i) => {
          const Icon = metricIcons[i] ?? Activity;
          return (
            <motion.div key={metric.label} custom={i + 1} initial="hidden" animate="visible" variants={fadeUp}>
              <Card className="h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <Badge variant={metric.delta?.startsWith("+") ? "success" : "secondary"}>
                      {metric.delta}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{metric.value}</p>
                    <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{metric.label}</p>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed pt-3" style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border-subtle)" }}>
                    {metric.note}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ── Main content grid ── */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">

        {/* Runtime intelligence */}
        <motion.div custom={5} initial="hidden" animate="visible" variants={fadeUp}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    Runtime Intelligence
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Live model routing, budget guardrails, and observability status
                  </CardDescription>
                </div>
                <Link href="/runtime-intelligence">
                  <Badge variant="warning" className="cursor-pointer hover:opacity-80 transition-opacity">
                    View details →
                  </Badge>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {runtimeRules.map((rule) => (
                <RuleRow key={rule.id} rule={rule} />
              ))}

              <Separator className="my-1" />

              {/* What this means — beginner helper */}
              <div className="rounded-xl p-3 flex gap-2.5" style={{ background: "var(--info-bg)", border: "1px solid var(--info-border)" }}>
                <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--info-text)" }} />
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>What is this?</span> These rules automatically control which AI model handles each request, keeping costs low and responses fast.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right column */}
        <div className="flex flex-col gap-6">

          {/* Weekly usage */}
          <motion.div custom={6} initial="hidden" animate="visible" variants={fadeUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-violet-400" />
                  Weekly Activity
                </CardTitle>
                <CardDescription>Conversations and AI operations this week</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analyticsSeries.map((point) => (
                  <div key={point.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{point.label}</span>
                      <span className="font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                        {formatCompactNumber(point.value)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
                      {point.value > 0 && (
                        <div
                          className="h-2 rounded-full bg-linear-to-r from-cyan-400 to-violet-400"
                          style={{ width: `${Math.min(100, point.value)}%` }}
                        />
                      )}
                    </div>
                  </div>
                ))}
                <Separator className="mt-1" />
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <MiniStat
                    label="Monthly spend"
                    value={budgetSummary.monthlySpend !== null ? formatCurrency(budgetSummary.monthlySpend) : "—"}
                  />
                  <MiniStat
                    label="Budget used"
                    value={budgetSummary.budgetUsed !== null ? formatPercent(budgetSummary.budgetUsed) : "—"}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Memory density */}
          <motion.div custom={7} initial="hidden" animate="visible" variants={fadeUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-cyan-400" />
                  Recent Memory
                </CardTitle>
                <CardDescription>Latest customer insights captured by RecallIQ</CardDescription>
              </CardHeader>
              <CardContent>
                {memoryEntries.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <div className="h-10 w-10 rounded-xl border flex items-center justify-center" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No memories yet</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Run the seed script or interact with customers to capture insights</p>
                    </div>
                    <Link href="/ai-memory">
                      <Button variant="secondary" size="sm">View memory store</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {memoryEntries.map((entry) => (
                      <div key={entry.id} className="rounded-xl p-3" style={{ border: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-snug" style={{ color: "var(--text-primary)" }}>{entry.memoryKey}</p>
                          <span className="text-[10px] shrink-0 mt-0.5" style={{ color: "var(--text-secondary)" }}>
                            {formatRelativeTime(entry.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>{entry.summary}</p>
                      </div>
                    ))}
                    <Link href="/ai-memory">
                      <Button variant="ghost" size="sm" className="w-full mt-1">
                        View all memories <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ── AI Recommendation ── */}
      {memoryEntries[0] && (
        <motion.div custom={8} initial="hidden" animate="visible" variants={fadeUp}>
          <RecommendationCard
            title={memoryEntries[0]?.memoryKey ?? "AI Recommendation"}
            body={memoryEntries[0]?.summary ?? "No recommendation available yet. Run analysis to generate suggestions."}
            score={memoryEntries[0]?.confidence ?? undefined}
          />
        </motion.div>
      )}

      {/* ── Product principles ── */}
      <motion.div custom={9} initial="hidden" animate="visible" variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Platform Principles
            </CardTitle>
            <CardDescription>The core design values that guide how RecallIQ works</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {productPrinciples.map((item, i) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-xl p-3.5"
                  style={{ border: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}
                >
                  <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-linear-to-br from-cyan-500/30 to-violet-500/20 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-cyan-300">{i + 1}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function StatusChip({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "cyan" | "violet" | "emerald" | "amber";
}) {
  const colorMap = {
    cyan:    { text: "#22d3ee", bg: "rgba(6,182,212,0.10)", border: "rgba(34,211,238,0.20)" },
    violet:  { text: "#a78bfa", bg: "rgba(139,92,246,0.10)", border: "rgba(167,139,250,0.20)" },
    emerald: { text: "#34d399", bg: "rgba(16,185,129,0.10)", border: "rgba(52,211,153,0.20)" },
    amber:   { text: "#fbbf24", bg: "rgba(245,158,11,0.10)", border: "rgba(251,191,36,0.20)" },
  };
  const c = colorMap[color];
  return (
    <div className="rounded-xl p-3" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <div className="flex items-center gap-1.5 text-xs opacity-80 mb-1.5" style={{ color: c.text }}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

function RuleRow({ rule }: { rule: any }) {
  const statusConfig = {
    healthy: { variant: "success" as const, icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    watch:   { variant: "warning" as const, icon: <AlertCircle className="h-3.5 w-3.5" /> },
    breached:{ variant: "destructive" as const, icon: <AlertCircle className="h-3.5 w-3.5" /> },
  };
  const config = statusConfig[rule.status as keyof typeof statusConfig] ?? statusConfig.healthy;

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl p-3.5" style={{ border: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{rule.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{rule.detail}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{rule.value}</span>
        <Badge variant={config.variant} className="gap-1">
          {config.icon}
          {rule.status}
        </Badge>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-3" style={{ border: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}>
      <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: "var(--text-secondary)" }}>{label}</p>
      <p className="mt-1.5 text-base font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}
