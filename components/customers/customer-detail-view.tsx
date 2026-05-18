"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, BrainCircuit, Building2, Calendar, CheckCircle2,
  ChevronRight, Clock, DollarSign, Globe, Heart, Mail, MessageSquare,
  Phone, Sparkles, Tag, TrendingDown, TrendingUp, User, Users, Zap,
  AlertTriangle, Shield, Target, Lightbulb, RefreshCw, Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import type {
  CustomerIntelligenceProfile,
  DealRiskAnalysis,
  SmartRecommendation,
} from "@/lib/services/sales-ai";

// ─── Types ─────────────────────────────────────────────────────────────────

interface CustomerRow {
  id: string;
  displayName: string;
  companyName: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  lifecycleStage: string;
  lifecycleScore: number;
  healthScore: number;
  sentiment?: string | null;
  pricingRisk?: string | null;
  annualContractValueCents: number;
  updatedAt: Date;
  createdAt: Date;
  ownerName?: string | null;
  ownerEmail?: string | null;
  metadata: Record<string, unknown>;
}

interface MemoryRow {
  id: string;
  entryKind: string;
  memoryKey: string;
  summary: string;
  importance: number;
  tags: string[];
  confidence: number | null;
  createdAt: Date;
}

interface ConversationRow {
  id: string;
  channel: string;
  subject?: string | null;
  status: string;
  summary?: string | null;
  tone?: string | null;
  outcome?: string | null;
  startedAt: Date;
  endedAt?: Date | null;
  updatedAt: Date;
}

interface FollowUpRow {
  id: string;
  title: string;
  body: string;
  rationale?: string | null;
  priority: number;
  status: string;
  confidence: number | null;
  dueAt?: Date | null;
  generatedAt: Date;
  completedAt?: Date | null;
  modelName?: string | null;
  metadata: Record<string, unknown>;
}

interface CustomerDetailViewProps {
  customer: CustomerRow;
  memories: MemoryRow[];
  conversations: ConversationRow[];
  followUps: FollowUpRow[];
  intelligenceProfile: CustomerIntelligenceProfile;
  riskAnalysis: DealRiskAnalysis;
  recommendations: SmartRecommendation[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  lead: "Lead", qualified: "Qualified", discovery: "Discovery",
  proposal: "Proposal", negotiation: "Negotiation",
  closed_won: "Closed Won", closed_lost: "Closed Lost",
};

const STAGE_ORDER = ["lead", "qualified", "discovery", "proposal", "negotiation", "closed_won"];

const CHANNEL_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  call:    { icon: <Phone className="h-3.5 w-3.5" />,    color: "text-cyan-400 bg-cyan-500/10 border-cyan-400/20",     label: "Call" },
  email:   { icon: <Mail className="h-3.5 w-3.5" />,     color: "text-violet-400 bg-violet-500/10 border-violet-400/20", label: "Email" },
  meeting: { icon: <Users className="h-3.5 w-3.5" />,    color: "text-emerald-400 bg-emerald-500/10 border-emerald-400/20", label: "Meeting" },
  slack:   { icon: <MessageSquare className="h-3.5 w-3.5" />, color: "text-amber-400 bg-amber-500/10 border-amber-400/20", label: "Slack" },
};

const MEMORY_KIND_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  objection:   { color: "text-rose-400",    bg: "rgba(244,63,94,0.08)",   border: "rgba(251,113,133,0.20)" },
  pricing:     { color: "text-amber-400",   bg: "rgba(245,158,11,0.08)",  border: "rgba(251,191,36,0.20)" },
  tone:        { color: "text-violet-400",  bg: "rgba(139,92,246,0.08)",  border: "rgba(167,139,250,0.20)" },
  stakeholder: { color: "text-cyan-400",    bg: "rgba(6,182,212,0.08)",   border: "rgba(34,211,238,0.20)" },
  security:    { color: "text-orange-400",  bg: "rgba(249,115,22,0.08)",  border: "rgba(251,146,60,0.20)" },
  timeline:    { color: "text-emerald-400", bg: "rgba(16,185,129,0.08)",  border: "rgba(52,211,153,0.20)" },
  preference:  { color: "text-sky-400",     bg: "rgba(14,165,233,0.08)",  border: "rgba(56,189,248,0.20)" },
  summary:     { color: "text-slate-400",   bg: "rgba(100,116,139,0.08)", border: "rgba(148,163,184,0.20)" },
  strategy:    { color: "text-green-400",   bg: "rgba(34,197,94,0.08)",   border: "rgba(74,222,128,0.20)" },
};

const RECOMMENDATION_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  follow_up_now:        { icon: <Send className="h-4 w-4" />,         color: "text-cyan-400" },
  send_case_study:      { icon: <Lightbulb className="h-4 w-4" />,    color: "text-violet-400" },
  schedule_demo:        { icon: <Calendar className="h-4 w-4" />,     color: "text-emerald-400" },
  escalate_to_manager:  { icon: <AlertTriangle className="h-4 w-4" />, color: "text-rose-400" },
  address_objection:    { icon: <Shield className="h-4 w-4" />,       color: "text-amber-400" },
  send_proposal:        { icon: <Target className="h-4 w-4" />,       color: "text-green-400" },
  check_in:             { icon: <RefreshCw className="h-4 w-4" />,    color: "text-slate-400" },
  close_deal:           { icon: <Zap className="h-4 w-4" />,          color: "text-amber-400" },
  nurture:              { icon: <Heart className="h-4 w-4" />,        color: "text-pink-400" },
};

const PRIORITY_VARIANT: Record<string, "destructive" | "warning" | "secondary" | "success"> = {
  urgent: "destructive", high: "warning", medium: "secondary", low: "success",
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const } }),
};

// ─── Main component ────────────────────────────────────────────────────────

export function CustomerDetailView({
  customer,
  memories,
  conversations,
  followUps,
  intelligenceProfile,
  riskAnalysis,
  recommendations,
}: CustomerDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "memory" | "followups">("overview");

  const healthColor = customer.healthScore >= 70 ? "text-emerald-400" : customer.healthScore >= 40 ? "text-amber-400" : "text-rose-400";
  const healthBg = customer.healthScore >= 70 ? "bg-emerald-400" : customer.healthScore >= 40 ? "bg-amber-400" : "bg-rose-400";
  const stageIdx = STAGE_ORDER.indexOf(customer.lifecycleStage);

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link href="/customers" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        All customers
      </Link>

      {/* Hero profile card */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              {/* Identity */}
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/25 to-violet-500/20 border border-white/10 text-cyan-300 font-bold text-xl">
                  {customer.companyName.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{customer.companyName}</h1>
                  <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {customer.displayName}
                    {customer.ownerName && <><span className="text-slate-600">·</span><span>Owner: {customer.ownerName}</span></>}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">{STAGE_LABELS[customer.lifecycleStage] ?? customer.lifecycleStage}</Badge>
                    {customer.pricingRisk && (
                      <Badge variant={customer.pricingRisk === "high" ? "destructive" : customer.pricingRisk === "medium" ? "warning" : "success"}>
                        {customer.pricingRisk} pricing risk
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      <Heart className="h-3 w-3" />
                      {customer.healthScore}/100 health
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact + ACV */}
              <div className="flex flex-wrap gap-3">
                {customer.email && (
                  <a href={`mailto:${customer.email}`} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                    <Mail className="h-3.5 w-3.5" />
                    {customer.email}
                  </a>
                )}
                {customer.phone && (
                  <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                    <Phone className="h-3.5 w-3.5" />
                    {customer.phone}
                  </a>
                )}
                {customer.website && (
                  <a href={customer.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                    <Globe className="h-3.5 w-3.5" />
                    Website
                  </a>
                )}
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <DollarSign className="h-3.5 w-3.5" />
                  {formatCurrency(customer.annualContractValueCents / 100)} ACV
                </div>
              </div>
            </div>

            {/* Pipeline progress */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Pipeline stage</span>
                <span className="text-xs font-semibold text-slate-300">{STAGE_LABELS[customer.lifecycleStage]}</span>
              </div>
              <div className="flex gap-1">
                {STAGE_ORDER.map((stage, i) => (
                  <div
                    key={stage}
                    className={`flex-1 h-1.5 rounded-full transition-all ${i <= stageIdx ? healthBg : "bg-white/8"}`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-slate-600">Lead</span>
                <span className="text-[9px] text-slate-600">Closed</span>
              </div>
            </div>

            {/* Health bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500">Health score</span>
                <span className={`text-xs font-bold ${healthColor}`}>{customer.healthScore}/100</span>
              </div>
              <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${customer.healthScore}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-2 rounded-full ${healthBg}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tab nav */}
      <div className="flex gap-1 rounded-xl p-1" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
        {(["overview", "timeline", "memory", "followups"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all capitalize ${
              activeTab === tab
                ? "bg-green-500/15 text-green-400 border border-green-400/25"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab === "followups" ? "Follow-ups" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab
          customer={customer}
          intelligenceProfile={intelligenceProfile}
          riskAnalysis={riskAnalysis}
          recommendations={recommendations}
          memories={memories}
        />
      )}
      {activeTab === "timeline" && <TimelineTab conversations={conversations} />}
      {activeTab === "memory" && <MemoryTab memories={memories} />}
      {activeTab === "followups" && <FollowUpsTab followUps={followUps} customerId={customer.id} />}
    </div>
  );
}

// ─── Overview tab ──────────────────────────────────────────────────────────

function OverviewTab({ customer, intelligenceProfile, riskAnalysis, recommendations, memories }: {
  customer: CustomerRow;
  intelligenceProfile: CustomerIntelligenceProfile;
  riskAnalysis: DealRiskAnalysis;
  recommendations: SmartRecommendation[];
  memories: MemoryRow[];
}) {
  const riskColor = riskAnalysis.riskLevel === "critical" ? "text-rose-400" : riskAnalysis.riskLevel === "high" ? "text-orange-400" : riskAnalysis.riskLevel === "medium" ? "text-amber-400" : "text-emerald-400";
  const riskBg = riskAnalysis.riskLevel === "critical" ? "rgba(244,63,94,0.10)" : riskAnalysis.riskLevel === "high" ? "rgba(249,115,22,0.10)" : riskAnalysis.riskLevel === "medium" ? "rgba(245,158,11,0.10)" : "rgba(16,185,129,0.10)";
  const riskBorder = riskAnalysis.riskLevel === "critical" ? "rgba(251,113,133,0.25)" : riskAnalysis.riskLevel === "high" ? "rgba(251,146,60,0.25)" : riskAnalysis.riskLevel === "medium" ? "rgba(251,191,36,0.25)" : "rgba(52,211,153,0.25)";

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      {/* Left column */}
      <div className="space-y-6">
        {/* AI Recommendations */}
        <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                AI Recommendations
              </CardTitle>
              <CardDescription>Smart next actions based on customer history and signals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.map((rec, i) => {
                const cfg = RECOMMENDATION_CONFIG[rec.type] ?? RECOMMENDATION_CONFIG.check_in;
                return (
                  <motion.div
                    key={i}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    className="flex items-start gap-3 rounded-xl p-3.5"
                    style={{ border: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}
                  >
                    <div className={`shrink-0 mt-0.5 ${cfg.color}`}>{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-slate-200">{rec.title}</p>
                        <Badge variant={PRIORITY_VARIANT[rec.priority] ?? "secondary"} className="shrink-0 text-[10px]">
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{rec.description}</p>
                      <p className="text-[11px] text-slate-600 mt-1.5 italic">{rec.reasoning}</p>
                      {rec.dueInHours && (
                        <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due in {rec.dueInHours}h
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Deal risk */}
        <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-400" />
                    Deal Risk Analysis
                  </CardTitle>
                  <CardDescription>AI-assessed risk factors and mitigation strategies</CardDescription>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${riskColor}`}>{riskAnalysis.riskScore}</p>
                  <p className="text-[10px] text-slate-500">risk score</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Risk gauge */}
              <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${riskAnalysis.riskScore}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-2 rounded-full"
                  style={{ background: `linear-gradient(90deg, #34d399, #fbbf24 50%, #f87171)` }}
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <RiskStat label="Churn prob." value={`${Math.round(riskAnalysis.churnProbability * 100)}%`} />
                <RiskStat label="Forecast conf." value={`${Math.round(riskAnalysis.forecastConfidence * 100)}%`} />
                <RiskStat label="Time to decision" value={riskAnalysis.timeToDecision} />
              </div>

              {/* Risk factors */}
              {riskAnalysis.riskFactors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Risk factors</p>
                  {riskAnalysis.riskFactors.map((rf, i) => (
                    <div key={i} className="rounded-xl p-3" style={{ background: riskBg, border: `1px solid ${riskBorder}` }}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-slate-200">{rf.factor}</p>
                        <Badge variant={rf.impact === "high" ? "destructive" : rf.impact === "medium" ? "warning" : "secondary"} className="text-[10px]">
                          {rf.impact}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400">{rf.mitigation}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommended actions */}
              {riskAnalysis.recommendedActions.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Recommended actions</p>
                  {riskAnalysis.recommendedActions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <ChevronRight className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      {action}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Right column */}
      <div className="space-y-6">
        {/* Customer intelligence profile */}
        <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-violet-400" />
                Customer Intelligence
              </CardTitle>
              <CardDescription>AI-built personality and communication profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Personality type */}
              <div className="rounded-xl p-3.5" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(167,139,250,0.20)" }}>
                <p className="text-[10px] uppercase tracking-wider text-violet-400 mb-1">Personality type</p>
                <p className="text-sm font-bold text-white capitalize">{intelligenceProfile.personalityType}</p>
                <p className="text-xs text-slate-400 mt-1">{intelligenceProfile.communicationStyle}</p>
              </div>

              {/* Relationship strength */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Relationship strength</span>
                  <span className="font-semibold text-slate-300">{intelligenceProfile.relationshipStrength}/100</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${intelligenceProfile.relationshipStrength}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="h-1.5 rounded-full bg-gradient-to-r from-violet-400 to-cyan-400"
                  />
                </div>
              </div>

              <Separator />

              {/* Decision making */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Decision pattern</p>
                <p className="text-xs text-slate-300">{intelligenceProfile.decisionMakingPattern}</p>
              </div>

              {/* Key motivators */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Key motivators</p>
                <div className="flex flex-wrap gap-1.5">
                  {intelligenceProfile.keyMotivators.map((m) => (
                    <span key={m} className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/8 px-2 py-0.5 text-[10px] text-emerald-300">
                      <TrendingUp className="h-2.5 w-2.5" />
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Potential blockers */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Potential blockers</p>
                <div className="flex flex-wrap gap-1.5">
                  {intelligenceProfile.potentialBlockers.map((b) => (
                    <span key={b} className="inline-flex items-center gap-1 rounded-full border border-rose-400/20 bg-rose-500/8 px-2 py-0.5 text-[10px] text-rose-300">
                      <TrendingDown className="h-2.5 w-2.5" />
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {/* Adaptation tips */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">How to adapt your approach</p>
                <div className="space-y-1.5">
                  {intelligenceProfile.adaptationTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <Lightbulb className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top memories */}
        <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-cyan-400" />
                  Top Memories
                </CardTitle>
                <Badge variant="secondary">{memories.length}</Badge>
              </div>
              <CardDescription>Highest-importance retained context</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {memories.slice(0, 4).map((m) => {
                const cfg = MEMORY_KIND_CONFIG[m.entryKind] ?? MEMORY_KIND_CONFIG.summary;
                return (
                  <div key={m.id} className="rounded-xl p-3" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.color}`}>{m.entryKind}</span>
                      <span className="text-[10px] text-slate-600">{Math.round((m.confidence ?? 0) * 100)}% conf.</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{m.summary}</p>
                  </div>
                );
              })}
              {memories.length > 4 && (
                <button
                  className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
                  onClick={() => {}}
                >
                  +{memories.length - 4} more memories
                </button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function RiskStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-2.5 text-center" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-white mt-0.5 tabular-nums">{value}</p>
    </div>
  );
}

// ─── Timeline tab ──────────────────────────────────────────────────────────

function TimelineTab({ conversations }: { conversations: ConversationRow[] }) {
  if (!conversations.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <MessageSquare className="h-10 w-10 text-slate-600" />
          <p className="text-sm text-slate-500">No conversations recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
        <Clock className="h-4 w-4 text-slate-500" />
        Conversation timeline
        <Badge variant="secondary">{conversations.length}</Badge>
      </h2>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-white/8" />
        <div className="space-y-4">
          {conversations.map((conv, i) => {
            const ch = CHANNEL_CONFIG[conv.channel] ?? CHANNEL_CONFIG.call;
            const toneVariant = conv.tone === "positive" ? "success" : conv.tone === "negative" ? "destructive" : "secondary";
            return (
              <motion.div
                key={conv.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="flex gap-4 pl-2"
              >
                {/* Timeline dot */}
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border z-10 ${ch.color}`}>
                  {ch.icon}
                </div>
                <Card className="flex-1">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{conv.subject || ch.label}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {new Date(conv.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          {conv.endedAt && (
                            <><span className="text-slate-600">·</span>
                            {Math.round((new Date(conv.endedAt).getTime() - new Date(conv.startedAt).getTime()) / 60000)}m</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {conv.tone && <Badge variant={toneVariant as any} className="text-[10px]">{conv.tone}</Badge>}
                        <Badge variant="secondary" className="text-[10px]">{conv.status}</Badge>
                      </div>
                    </div>
                    {conv.summary && (
                      <p className="text-xs text-slate-400 leading-relaxed mb-2">{conv.summary}</p>
                    )}
                    {conv.outcome && (
                      <div className="flex items-start gap-2 rounded-lg border border-white/8 bg-white/3 px-3 py-2">
                        <ChevronRight className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-slate-500 block mb-0.5">Next step</span>
                          <p className="text-xs text-slate-300">{conv.outcome}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Memory tab ────────────────────────────────────────────────────────────

function MemoryTab({ memories }: { memories: MemoryRow[] }) {
  const grouped = memories.reduce<Record<string, MemoryRow[]>>((acc, m) => {
    const k = m.entryKind;
    if (!acc[k]) acc[k] = [];
    acc[k].push(m);
    return acc;
  }, {});

  if (!memories.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <BrainCircuit className="h-10 w-10 text-slate-600" />
          <p className="text-sm text-slate-500">No memory entries yet for this customer.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-slate-500" />
          Memory insights
          <Badge variant="secondary">{memories.length} entries</Badge>
        </h2>
      </div>

      {/* Confidence distribution */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-slate-400 mb-3">Memory confidence distribution</p>
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {[
              { label: "High (>80%)", count: memories.filter((m) => (m.confidence ?? 0) >= 0.8).length, color: "bg-emerald-400" },
              { label: "Medium (50–80%)", count: memories.filter((m) => (m.confidence ?? 0) >= 0.5 && (m.confidence ?? 0) < 0.8).length, color: "bg-amber-400" },
              { label: "Low (<50%)", count: memories.filter((m) => (m.confidence ?? 0) < 0.5).length, color: "bg-rose-400" },
            ].map((seg) => {
              const pct = memories.length > 0 ? (seg.count / memories.length) * 100 : 0;
              return pct > 0 ? (
                <div key={seg.label} className={`${seg.color} h-3`} style={{ width: `${pct}%` }} title={`${seg.label}: ${seg.count}`} />
              ) : null;
            })}
          </div>
        </CardContent>
      </Card>

      {/* Grouped by kind */}
      {Object.entries(grouped).map(([kind, entries]) => {
        const cfg = MEMORY_KIND_CONFIG[kind] ?? MEMORY_KIND_CONFIG.summary;
        return (
          <div key={kind}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${cfg.color}`}>{kind} ({entries.length})</h3>
            <div className="space-y-2">
              {entries.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-xl p-3.5"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <p className="text-sm font-semibold text-slate-200">{m.memoryKey.replace(/_/g, " ")}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-500">{Math.round((m.confidence ?? 0) * 100)}%</span>
                      <span className="text-[10px] text-slate-600">{formatRelativeTime(m.createdAt)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{m.summary}</p>
                  {m.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {m.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">
                          <Tag className="h-2.5 w-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Follow-ups tab ────────────────────────────────────────────────────────

function FollowUpsTab({ followUps, customerId }: { followUps: FollowUpRow[]; customerId: string }) {
  const [generating, setGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string; tone: string } | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/follow-ups/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, organizationId: "demo-org" }),
      });
      const data = await res.json();
      if (data.followUp) setGeneratedEmail(data.followUp);
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  }

  const statusVariant: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
    draft: "secondary", queued: "warning", sent: "success", completed: "success", cancelled: "destructive",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Send className="h-4 w-4 text-slate-500" />
          Follow-up emails
          <Badge variant="secondary">{followUps.length}</Badge>
        </h2>
        <Button size="sm" onClick={handleGenerate} disabled={generating}>
          {generating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {generating ? "Generating..." : "Generate AI follow-up"}
        </Button>
      </div>

      {/* Generated email preview */}
      {generatedEmail && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  AI-generated follow-up
                </CardTitle>
                <Badge variant="success">New</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl p-3" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-default)" }}>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Subject</p>
                <p className="text-sm font-semibold text-slate-200">{generatedEmail.subject}</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-default)" }}>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Body</p>
                <pre className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">{generatedEmail.body}</pre>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary">Copy to clipboard</Button>
                <Button size="sm">Send email</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Existing follow-ups */}
      {!followUps.length && !generatedEmail ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Send className="h-10 w-10 text-slate-600" />
            <p className="text-sm text-slate-500">No follow-ups yet. Generate one with AI.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {followUps.map((fu, i) => (
            <motion.div key={fu.id} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm font-semibold text-slate-200">{fu.title}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusVariant[fu.status] ?? "secondary"} className="text-[10px]">{fu.status}</Badge>
                      {fu.dueAt && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(fu.dueAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{fu.body}</p>
                  {fu.rationale && (
                    <p className="text-[11px] text-slate-600 mt-2 italic">{fu.rationale}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <span className="text-[10px] text-slate-600">
                      {Math.round((fu.confidence ?? 0) * 100)}% confidence
                    </span>
                    {fu.modelName && <span className="text-[10px] text-slate-600 font-mono">{fu.modelName}</span>}
                    <span className="text-[10px] text-slate-600 ml-auto">{formatRelativeTime(fu.generatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
