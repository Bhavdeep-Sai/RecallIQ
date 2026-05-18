export type CustomerStage = "prospecting" | "discovery" | "proposal" | "negotiation" | "closed-won";
export type ConversationTone = "positive" | "neutral" | "guarded" | "price-sensitive" | "urgent";
export type RuntimeCategory = "routing" | "cost" | "latency" | "budget" | "observability";

export interface DashboardMetric {
  label: string;
  value: string;
  delta: string;
  note: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  company: string;
  stage: CustomerStage;
  sentiment: string;
  lastTouchpoint: string;
  healthScore: number;
  pricingRisk: "low" | "medium" | "high";
  owner: string;
  forecastValue: number;
}

export interface ConversationRecord {
  id: string;
  customer: string;
  channel: "call" | "email" | "meeting" | "slack";
  summary: string;
  tone: ConversationTone;
  nextStep: string;
  updatedAt: string;
}

export interface MemoryEntry {
  id: string;
  subject: string;
  insight: string;
  confidence: number;
  tags: string[];
  updatedAt: string;
}

export interface RuntimeRule {
  id: string;
  category: RuntimeCategory;
  title: string;
  status: "healthy" | "watch" | "breached";
  value: string;
  detail: string;
}

export interface AnalyticsDatum {
  label: string;
  value: number;
}

export interface SettingSection {
  title: string;
  description: string;
}