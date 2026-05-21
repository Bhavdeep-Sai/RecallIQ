/**
 * Sales AI Service
 *
 * Core AI engine for RecallIQ sales workflows:
 * - Follow-up email generation (memory-aware)
 * - Objection tracking & response suggestions
 * - Sentiment analysis
 * - Buying signal detection
 * - Meeting summary generation
 * - Deal risk analysis
 * - Smart recommendations
 * - Personalized conversation generation
 */

import { generateObject, generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { getDb, getSupabaseAdmin } from "@/lib/db/client";
import {
  aiFollowUps,
  aiMemoryEntries,
  conversations,
  customers,
  messages,
} from "@/lib/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { injectMemory, ingestMemory } from "./memory";
import { cascadeText } from "./cascadeflow";

// ─── Groq client ───────────────────────────────────────────────────────────

function groq() {
  return createGroq({ apiKey: process.env.GROQ_API_KEY });
}

// ─── Sentiment analysis ────────────────────────────────────────────────────

export type SentimentLabel = "very_positive" | "positive" | "neutral" | "negative" | "very_negative";

export interface SentimentResult {
  label: SentimentLabel;
  score: number; // 0–1, 1 = most positive
  summary: string;
  signals: string[];
}

const sentimentSchema = z.object({
  label: z.enum(["very_positive", "positive", "neutral", "negative", "very_negative"]),
  score: z.number().min(0).max(1),
  summary: z.string().describe("One sentence describing the overall sentiment"),
  signals: z.array(z.string()).describe("Specific phrases or signals that drove this sentiment"),
});

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  try {
    const { object } = await generateObject({
      model: groq()("llama3-8b-8192"),
      schema: sentimentSchema,
      prompt: `Analyze the sentiment of this customer message or conversation excerpt. Be precise and identify specific signals.\n\nText: "${text}"`,
    });
    return object;
  } catch {
    return { label: "neutral", score: 0.5, summary: "Unable to analyze sentiment", signals: [] };
  }
}

// ─── Buying signal detection ───────────────────────────────────────────────

export interface BuyingSignal {
  type: "urgency" | "budget_confirmed" | "stakeholder_engaged" | "competitor_mentioned" | "timeline_set" | "positive_language" | "demo_request" | "pricing_inquiry";
  strength: "weak" | "moderate" | "strong";
  evidence: string;
  recommendation: string;
}

const buyingSignalsSchema = z.object({
  signals: z.array(z.object({
    type: z.enum(["urgency", "budget_confirmed", "stakeholder_engaged", "competitor_mentioned", "timeline_set", "positive_language", "demo_request", "pricing_inquiry"]),
    strength: z.enum(["weak", "moderate", "strong"]),
    evidence: z.string().describe("The exact phrase or context that triggered this signal"),
    recommendation: z.string().describe("What the sales rep should do next based on this signal"),
  })),
  overallReadiness: z.number().min(0).max(100).describe("Purchase readiness score 0-100"),
  nextBestAction: z.string().describe("The single most important next action for the sales rep"),
});

export async function detectBuyingSignals(conversationText: string, customerContext?: string): Promise<{
  signals: BuyingSignal[];
  overallReadiness: number;
  nextBestAction: string;
}> {
  try {
    const contextBlock = customerContext ? `\n\nCustomer context: ${customerContext}` : "";
    const { object } = await generateObject({
      model: groq()("llama3-70b-8192"),
      schema: buyingSignalsSchema,
      prompt: `Analyze this sales conversation for buying signals. Identify urgency, budget confirmation, stakeholder engagement, competitor mentions, timeline commitments, and other purchase intent indicators.${contextBlock}\n\nConversation:\n${conversationText}`,
    });
    return object;
  } catch {
    return { signals: [], overallReadiness: 0, nextBestAction: "Continue building rapport" };
  }
}

// ─── Objection tracking ────────────────────────────────────────────────────

export interface ObjectionRecord {
  category: "pricing" | "timing" | "competition" | "authority" | "need" | "trust" | "technical" | "other";
  objection: string;
  severity: "low" | "medium" | "high";
  suggestedResponse: string;
  memoryContext: string; // what we know from past interactions
}

const objectionSchema = z.object({
  objections: z.array(z.object({
    category: z.enum(["pricing", "timing", "competition", "authority", "need", "trust", "technical", "other"]),
    objection: z.string().describe("The exact objection raised"),
    severity: z.enum(["low", "medium", "high"]),
    suggestedResponse: z.string().describe("A personalized, memory-aware response to this objection"),
    memoryContext: z.string().describe("What past context is relevant to this objection"),
  })),
});

export async function extractObjections(
  conversationText: string,
  memoryContext: string,
): Promise<ObjectionRecord[]> {
  try {
    const { object } = await generateObject({
      model: groq()("llama3-70b-8192"),
      schema: objectionSchema,
      prompt: `Extract all customer objections from this conversation. For each objection, suggest a personalized response that references the customer's history and context.\n\nMemory context from past interactions:\n${memoryContext || "No prior context available."}\n\nConversation:\n${conversationText}`,
    });
    return object.objections;
  } catch {
    return [];
  }
}

// ─── Meeting summary ───────────────────────────────────────────────────────

export interface MeetingSummary {
  headline: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: Array<{ owner: string; action: string; dueDate?: string }>;
  customerMood: SentimentLabel;
  riskFlags: string[];
  nextMeetingAgenda: string[];
}

const meetingSummarySchema = z.object({
  headline: z.string().describe("One sentence capturing the essence of the meeting"),
  keyPoints: z.array(z.string()).describe("3-5 most important discussion points"),
  decisions: z.array(z.string()).describe("Decisions made during the meeting"),
  actionItems: z.array(z.object({
    owner: z.string(),
    action: z.string(),
    dueDate: z.string().optional(),
  })),
  customerMood: z.enum(["very_positive", "positive", "neutral", "negative", "very_negative"]),
  riskFlags: z.array(z.string()).describe("Any red flags or risks identified"),
  nextMeetingAgenda: z.array(z.string()).describe("Suggested agenda items for the next meeting"),
});

export async function generateMeetingSummary(
  transcript: string,
  customerName: string,
  memoryContext: string,
): Promise<MeetingSummary> {
  try {
    const { object } = await generateObject({
      model: groq()("mixtral-8x7b-32768"),
      schema: meetingSummarySchema,
      prompt: `Generate a comprehensive meeting summary for a sales call with ${customerName}.\n\nPast context about this customer:\n${memoryContext || "No prior context."}\n\nMeeting transcript:\n${transcript}`,
    });
    return object;
  } catch {
    return {
      headline: "Meeting summary unavailable",
      keyPoints: [],
      decisions: [],
      actionItems: [],
      customerMood: "neutral",
      riskFlags: [],
      nextMeetingAgenda: [],
    };
  }
}

// ─── Deal risk analysis ────────────────────────────────────────────────────

export interface DealRiskAnalysis {
  riskScore: number; // 0–100, 100 = highest risk
  riskLevel: "low" | "medium" | "high" | "critical";
  riskFactors: Array<{ factor: string; impact: "low" | "medium" | "high"; mitigation: string }>;
  churnProbability: number; // 0–1
  forecastConfidence: number; // 0–1
  recommendedActions: string[];
  timeToDecision: string;
}

const dealRiskSchema = z.object({
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  riskFactors: z.array(z.object({
    factor: z.string(),
    impact: z.enum(["low", "medium", "high"]),
    mitigation: z.string(),
  })),
  churnProbability: z.number().min(0).max(1),
  forecastConfidence: z.number().min(0).max(1),
  recommendedActions: z.array(z.string()),
  timeToDecision: z.string().describe("Estimated time to purchase decision"),
});

export async function analyzeDealRisk(
  customerProfile: {
    name: string;
    company: string;
    stage: string;
    healthScore: number;
    sentiment?: string | null;
    pricingRisk?: string | null;
    acvCents: number;
  },
  recentConversations: string[],
  memoryContext: string,
): Promise<DealRiskAnalysis> {
  try {
    const profileText = `
Customer: ${customerProfile.name} at ${customerProfile.company}
Stage: ${customerProfile.stage}
Health score: ${customerProfile.healthScore}/100
Sentiment: ${customerProfile.sentiment ?? "unknown"}
Pricing risk: ${customerProfile.pricingRisk ?? "unknown"}
ACV: $${(customerProfile.acvCents / 100).toFixed(0)}
    `.trim();

    const convText = recentConversations.length
      ? recentConversations.slice(0, 3).join("\n---\n")
      : "No recent conversations.";

    const { object } = await generateObject({
      model: groq()("llama3-70b-8192"),
      schema: dealRiskSchema,
      prompt: `Analyze the deal risk for this customer. Consider their health score, sentiment, pricing risk, conversation history, and memory context.\n\nCustomer profile:\n${profileText}\n\nMemory context:\n${memoryContext || "None"}\n\nRecent conversations:\n${convText}`,
    });
    return object;
  } catch {
    return {
      riskScore: 50,
      riskLevel: "medium",
      riskFactors: [],
      churnProbability: 0.3,
      forecastConfidence: 0.5,
      recommendedActions: ["Schedule a check-in call"],
      timeToDecision: "Unknown",
    };
  }
}

// ─── Follow-up email generation ────────────────────────────────────────────

export interface FollowUpEmail {
  subject: string;
  body: string;
  tone: "formal" | "friendly" | "urgent" | "consultative";
  personalizationNotes: string[];
  confidence: number;
  rationale: string;
}

const followUpEmailSchema = z.object({
  subject: z.string().describe("Email subject line"),
  body: z.string().describe("Full email body in plain text"),
  tone: z.enum(["formal", "friendly", "urgent", "consultative"]),
  personalizationNotes: z.array(z.string()).describe("What was personalized and why"),
  confidence: z.number().min(0).max(1),
  rationale: z.string().describe("Why this follow-up approach was chosen"),
});

export async function generateFollowUpEmail(
  customerName: string,
  customerCompany: string,
  conversationSummary: string,
  memoryContext: string,
  senderName: string = "Your Sales Rep",
  urgency: "low" | "medium" | "high" = "medium",
): Promise<FollowUpEmail> {
  try {
    const { object } = await generateObject({
      model: groq()("mixtral-8x7b-32768"),
      schema: followUpEmailSchema,
      prompt: `Generate a personalized follow-up email for ${customerName} at ${customerCompany}.

The email should:
- Reference specific points from the conversation
- Address any objections or concerns raised
- Use the customer's communication style and tone preferences from memory
- Include a clear, specific call to action
- Feel human and personal, not templated

Sender: ${senderName}
Urgency: ${urgency}

Memory context from past interactions:
${memoryContext || "No prior context — write a warm, professional first-touch follow-up."}

Recent conversation summary:
${conversationSummary}`,
    });
    return object;
  } catch {
    return {
      subject: `Following up — ${customerCompany}`,
      body: `Hi ${customerName},\n\nThank you for your time. I wanted to follow up on our recent conversation.\n\nBest regards,\n${senderName}`,
      tone: "friendly",
      personalizationNotes: [],
      confidence: 0.5,
      rationale: "Fallback template — AI generation failed",
    };
  }
}

// ─── Smart recommendations ─────────────────────────────────────────────────

export type RecommendationType =
  | "follow_up_now"
  | "send_case_study"
  | "schedule_demo"
  | "escalate_to_manager"
  | "address_objection"
  | "send_proposal"
  | "check_in"
  | "close_deal"
  | "nurture";

export interface SmartRecommendation {
  type: RecommendationType;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  reasoning: string;
  suggestedMessage?: string;
  dueInHours?: number;
}

const recommendationsSchema = z.object({
  recommendations: z.array(z.object({
    type: z.enum([
      "follow_up_now", "send_case_study", "schedule_demo", "escalate_to_manager",
      "address_objection", "send_proposal", "check_in", "close_deal", "nurture",
    ]),
    title: z.string(),
    description: z.string(),
    priority: z.enum(["low", "medium", "high", "urgent"]),
    reasoning: z.string(),
    suggestedMessage: z.string().optional(),
    dueInHours: z.number().optional(),
  })),
});

export async function generateRecommendations(
  customerProfile: {
    name: string;
    company: string;
    stage: string;
    healthScore: number;
    sentiment?: string | null;
    pricingRisk?: string | null;
  },
  memoryContext: string,
  recentActivity: string,
): Promise<SmartRecommendation[]> {
  try {
    const { object } = await generateObject({
      model: groq()("llama3-70b-8192"),
      schema: recommendationsSchema,
      prompt: `Generate 3-5 smart, prioritized sales recommendations for this customer. Each recommendation should be specific, actionable, and grounded in the customer's history and current signals.

Customer: ${customerProfile.name} at ${customerProfile.company}
Stage: ${customerProfile.stage}
Health: ${customerProfile.healthScore}/100
Sentiment: ${customerProfile.sentiment ?? "unknown"}
Pricing risk: ${customerProfile.pricingRisk ?? "unknown"}

Memory context:
${memoryContext || "No prior context."}

Recent activity:
${recentActivity || "No recent activity."}`,
    });
    return object.recommendations;
  } catch {
    return [{
      type: "check_in",
      title: "Schedule a check-in",
      description: "Reach out to maintain momentum",
      priority: "medium",
      reasoning: "No recent activity detected",
    }];
  }
}

// ─── Conversation analysis pipeline ───────────────────────────────────────

export interface ConversationAnalysis {
  sentiment: SentimentResult;
  buyingSignals: { signals: BuyingSignal[]; overallReadiness: number; nextBestAction: string };
  objections: ObjectionRecord[];
  summary: string;
  tone: string;
  keyInsights: string[];
  suggestedNextStep: string;
}

export async function analyzeConversation(
  organizationId: string,
  customerId: string,
  conversationId: string,
  conversationText: string,
  customerName: string,
): Promise<ConversationAnalysis> {
  // Get memory context for this customer
  const memoryContext = await injectMemory(organizationId, customerId, conversationText);

  // Run all analyses in parallel
  const [sentiment, buyingSignals, objections] = await Promise.all([
    analyzeSentiment(conversationText),
    detectBuyingSignals(conversationText, memoryContext),
    extractObjections(conversationText, memoryContext),
  ]);

  // Generate a concise summary with memory context
  let summary = "";
  let keyInsights: string[] = [];
  let suggestedNextStep = buyingSignals.nextBestAction;

  try {
    const result = await generateObject({
      model: groq()("llama3-8b-8192"),
      schema: z.object({
        summary: z.string().describe("2-3 sentence summary of the conversation"),
        tone: z.string().describe("Overall tone in 2-3 words"),
        keyInsights: z.array(z.string()).describe("3 most important insights"),
        suggestedNextStep: z.string(),
      }),
      prompt: `Summarize this sales conversation with ${customerName}. Extract key insights and suggest the next step.\n\nMemory context:\n${memoryContext || "None"}\n\nConversation:\n${conversationText}`,
    });
    summary = result.object.summary;
    keyInsights = result.object.keyInsights;
    suggestedNextStep = result.object.suggestedNextStep;
  } catch {
    summary = "Conversation analysis unavailable.";
  }

  // Ingest new memories from this conversation (fire and forget)
  ingestMemory(organizationId, customerId, conversationId, "", conversationText).catch(() => {});

  return {
    sentiment,
    buyingSignals,
    objections,
    summary,
    tone: sentiment.label.replace("_", " "),
    keyInsights,
    suggestedNextStep,
  };
}

// ─── Customer intelligence profile ────────────────────────────────────────

export interface CustomerIntelligenceProfile {
  personalityType: "analytical" | "driver" | "expressive" | "amiable";
  communicationStyle: string;
  decisionMakingPattern: string;
  keyMotivators: string[];
  potentialBlockers: string[];
  adaptationTips: string[];
  relationshipStrength: number; // 0–100
}

const customerProfileSchema = z.object({
  personalityType: z.enum(["analytical", "driver", "expressive", "amiable"]),
  communicationStyle: z.string(),
  decisionMakingPattern: z.string(),
  keyMotivators: z.array(z.string()),
  potentialBlockers: z.array(z.string()),
  adaptationTips: z.array(z.string()).describe("How to adapt your sales approach for this customer"),
  relationshipStrength: z.number().min(0).max(100),
});

export async function buildCustomerIntelligenceProfile(
  customerName: string,
  memoryEntries: Array<{ kind: string; summary: string; importance: number }>,
  conversationSummaries: string[],
): Promise<CustomerIntelligenceProfile> {
  if (memoryEntries.length === 0 && conversationSummaries.length === 0) {
    return {
      personalityType: "analytical",
      communicationStyle: "Professional and data-driven",
      decisionMakingPattern: "Methodical — needs evidence and time",
      keyMotivators: ["ROI", "Risk reduction"],
      potentialBlockers: ["Insufficient data", "Budget constraints"],
      adaptationTips: ["Lead with data", "Provide case studies"],
      relationshipStrength: 20,
    };
  }

  try {
    const memoryText = memoryEntries
      .map((m) => `[${m.kind.toUpperCase()}] ${m.summary}`)
      .join("\n");
    const convText = conversationSummaries.slice(0, 5).join("\n---\n");

    const { object } = await generateObject({
      model: groq()("llama3-70b-8192"),
      schema: customerProfileSchema,
      prompt: `Build a customer intelligence profile for ${customerName} based on their interaction history. Identify their personality type, communication preferences, and how to best engage them.\n\nMemory entries:\n${memoryText || "None"}\n\nConversation history:\n${convText || "None"}`,
    });
    return object;
  } catch {
    return {
      personalityType: "analytical",
      communicationStyle: "Professional",
      decisionMakingPattern: "Methodical",
      keyMotivators: ["ROI"],
      potentialBlockers: ["Budget"],
      adaptationTips: ["Lead with data"],
      relationshipStrength: 30,
    };
  }
}

// ─── Personalized conversation starter ────────────────────────────────────

export async function generateConversationOpener(
  customerName: string,
  customerCompany: string,
  context: string,
  memoryContext: string,
  channel: "email" | "call" | "meeting" | "slack",
): Promise<string> {
  try {
    const result = await generateText({
      model: groq()("llama3-8b-8192"),
      prompt: `Generate a personalized, natural conversation opener for a ${channel} with ${customerName} at ${customerCompany}. It should feel warm, reference their history, and have a clear purpose.

Memory context:
${memoryContext || "First interaction — no prior history."}

Current context:
${context}

Keep it to 2-3 sentences maximum. Do not use generic openers like "I hope this email finds you well."`,
      maxOutputTokens: 200,
    });
    return result.text;
  } catch {
    return `Hi ${customerName}, I wanted to reach out regarding ${customerCompany}. I have some thoughts I'd love to share with you.`;
  }
}

// ─── Follow-up persistence ─────────────────────────────────────────────────

export async function saveFollowUp(
  organizationId: string,
  customerId: string,
  conversationId: string,
  email: FollowUpEmail,
  dueAt?: Date,
): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("ai_follow_ups")
      .insert({
        organization_id: organizationId,
        customer_id: customerId,
        conversation_id: conversationId,
        title: email.subject,
        body: email.body,
        rationale: email.rationale,
        priority: email.tone === "urgent" ? 1 : email.tone === "formal" ? 2 : 3,
        status: "draft",
        confidence: email.confidence,
        model_name: "mixtral-8x7b-32768",
        due_at: dueAt,
        metadata: {
          tone: email.tone,
          personalizationNotes: email.personalizationNotes,
        },
      })
      .select();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("saveFollowUp supabase error:", error);
      return null;
    }

    return (data && data[0] && (data[0].id ?? data[0].id)) || null;
  } catch (e) {
    return null;
  }
}

// ─── Load customer data for intelligence ──────────────────────────────────

export async function loadCustomerIntelligenceData(
  organizationId: string,
  customerId: string,
) {
  try {
    const supabase = getSupabaseAdmin();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const p1 = sb
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .limit(1);

    const p2 = sb
      .from("ai_memory_entries")
      .select("*")
      .eq("customer_id", customerId)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("importance", { ascending: false })
      .limit(20);

    const p3 = sb
      .from("conversations")
      .select("*")
      .eq("customer_id", customerId)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("started_at", { ascending: false })
      .limit(10);

    const p4 = sb
      .from("ai_follow_ups")
      .select("*")
      .eq("customer_id", customerId)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("generated_at", { ascending: false })
      .limit(10);

    const [r1, r2, r3, r4] = await Promise.all([p1, p2, p3, p4]);

    if (r1.error || r2.error || r3.error || r4.error) {
      // eslint-disable-next-line no-console
      console.error("loadCustomerIntelligenceData supabase errors:", r1.error, r2.error, r3.error, r4.error);
    }

    return {
      customer: (r1.data ?? [])[0] ?? null,
      memories: r2.data ?? [],
      conversations: r3.data ?? [],
      followUps: r4.data ?? [],
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("loadCustomerIntelligenceData error:", e);
    return null;
  }
}
