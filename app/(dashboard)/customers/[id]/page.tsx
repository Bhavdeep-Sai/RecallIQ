import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import {
  customers,
  teamMembers,
  conversations,
  aiMemoryEntries,
  aiFollowUps,
} from "@/lib/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { CustomerDetailView } from "@/components/customers/customer-detail-view";
import { LoadingState } from "@/components/system/loading-state";
import {
  buildCustomerIntelligenceProfile,
  analyzeDealRisk,
  generateRecommendations,
} from "@/lib/services/sales-ai";
import { injectMemory } from "@/lib/services/memory";

export const revalidate = 60;

async function CustomerDetailContent({ id }: { id: string }) {
  if (!process.env.DATABASE_URL) {
    // Demo mode
    const demoCustomer = {
      id,
      displayName: "Sarah Chen",
      companyName: "Acme Corp",
      email: "sarah@acme.com",
      phone: "+1 (555) 234-5678",
      website: "https://acme.com",
      lifecycleStage: "proposal" as const,
      lifecycleScore: 72,
      healthScore: 68,
      sentiment: "Engaged but price-sensitive. Mentioned Q4 budget constraints twice.",
      pricingRisk: "medium",
      annualContractValueCents: 4800000,
      updatedAt: new Date(),
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      ownerName: "Alex Rivera",
      ownerEmail: "alex@yourcompany.com",
      metadata: {},
    };
    const demoMemories = [
      { id: "m1", entryKind: "objection" as const, memoryKey: "budget_constraint", summary: "Mentioned Q4 budget freeze — decision pushed to Q1", importance: 90, tags: ["budget", "timing"], confidence: 0.92, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), updatedAt: new Date(), deletedAt: null, organizationId: "demo", customerId: id, conversationId: null, messageId: null, memoryValue: null, embedding: null, sourceRefs: [], validFrom: new Date(), validTo: null, metadata: {} },
      { id: "m2", entryKind: "stakeholder" as const, memoryKey: "champion", summary: "VP of Sales is the internal champion — has budget authority", importance: 85, tags: ["stakeholder", "champion"], confidence: 0.88, createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), updatedAt: new Date(), deletedAt: null, organizationId: "demo", customerId: id, conversationId: null, messageId: null, memoryValue: null, embedding: null, sourceRefs: [], validFrom: new Date(), validTo: null, metadata: {} },
      { id: "m3", entryKind: "pricing" as const, memoryKey: "pricing_sensitivity", summary: "Comparing against Competitor X — price is 20% higher concern", importance: 80, tags: ["pricing", "competition"], confidence: 0.85, createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), updatedAt: new Date(), deletedAt: null, organizationId: "demo", customerId: id, conversationId: null, messageId: null, memoryValue: null, embedding: null, sourceRefs: [], validFrom: new Date(), validTo: null, metadata: {} },
      { id: "m4", entryKind: "tone" as const, memoryKey: "communication_style", summary: "Prefers concise, data-driven communication. Dislikes long emails.", importance: 70, tags: ["tone", "preference"], confidence: 0.90, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), updatedAt: new Date(), deletedAt: null, organizationId: "demo", customerId: id, conversationId: null, messageId: null, memoryValue: null, embedding: null, sourceRefs: [], validFrom: new Date(), validTo: null, metadata: {} },
    ];
    const demoConversations = [
      { id: "c1", channel: "call", subject: "Q4 Planning Call", status: "closed" as const, summary: "Discussed Q4 budget constraints and Q1 timeline. Sarah confirmed VP approval needed.", tone: "positive", outcome: "Schedule technical demo in January", startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), endedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 3600000), updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { id: "c2", channel: "email", subject: "Proposal Follow-up", status: "closed" as const, summary: "Sent revised proposal with phased pricing. Sarah acknowledged receipt.", tone: "neutral", outcome: "Awaiting internal review", startedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), endedAt: null, updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) },
      { id: "c3", channel: "meeting", subject: "Discovery Session", status: "closed" as const, summary: "Deep dive into pain points. Team of 45 reps losing 3hrs/week on manual follow-ups.", tone: "positive", outcome: "Build ROI calculator", startedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), endedAt: null, updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
    ];
    const demoFollowUps = [
      { id: "f1", title: "Send ROI calculator for 45-rep team", body: "Hi Sarah,\n\nAs promised, here's the ROI calculator tailored for your 45-rep team...", rationale: "Customer asked for ROI data during discovery", priority: 1, status: "draft" as const, confidence: 0.91, dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), generatedAt: new Date(), completedAt: null, modelName: "mixtral-8x7b-32768", metadata: { tone: "consultative" }, organizationId: "demo", customerId: id, conversationId: "c1", messageId: null, createdByMemberId: null, assignedMemberId: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    ];

    const intelligenceProfile = await buildCustomerIntelligenceProfile(
      demoCustomer.displayName,
      demoMemories.map((m) => ({ kind: m.entryKind, summary: m.summary, importance: m.importance })),
      demoConversations.map((c) => c.summary ?? ""),
    );

    const riskAnalysis = await analyzeDealRisk(
      { name: demoCustomer.displayName, company: demoCustomer.companyName, stage: demoCustomer.lifecycleStage, healthScore: demoCustomer.healthScore, sentiment: demoCustomer.sentiment, pricingRisk: demoCustomer.pricingRisk, acvCents: demoCustomer.annualContractValueCents },
      demoConversations.map((c) => c.summary ?? ""),
      demoMemories.map((m) => m.summary).join("\n"),
    );

    const recommendations = await generateRecommendations(
      { name: demoCustomer.displayName, company: demoCustomer.companyName, stage: demoCustomer.lifecycleStage, healthScore: demoCustomer.healthScore, sentiment: demoCustomer.sentiment, pricingRisk: demoCustomer.pricingRisk },
      demoMemories.map((m) => m.summary).join("\n"),
      "Last contact 5 days ago via phone call",
    );

    return (
      <CustomerDetailView
        customer={demoCustomer as any}
        memories={demoMemories as any}
        conversations={demoConversations as any}
        followUps={demoFollowUps as any}
        intelligenceProfile={intelligenceProfile}
        riskAnalysis={riskAnalysis}
        recommendations={recommendations}
      />
    );
  }

  const db = getDb();

  const [customerRows, memoryRows, conversationRows, followUpRows] = await Promise.all([
    db.select({
      id: customers.id,
      displayName: customers.displayName,
      companyName: customers.companyName,
      email: customers.email,
      phone: customers.phone,
      website: customers.website,
      lifecycleStage: customers.lifecycleStage,
      lifecycleScore: customers.lifecycleScore,
      healthScore: customers.healthScore,
      sentiment: customers.sentiment,
      pricingRisk: customers.pricingRisk,
      annualContractValueCents: customers.annualContractValueCents,
      updatedAt: customers.updatedAt,
      createdAt: customers.createdAt,
      ownerName: teamMembers.fullName,
      ownerEmail: teamMembers.email,
      metadata: customers.metadata,
    })
      .from(customers)
      .leftJoin(teamMembers, eq(customers.ownerMemberId, teamMembers.id))
      .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
      .limit(1),

    db.select().from(aiMemoryEntries)
      .where(and(eq(aiMemoryEntries.customerId, id), isNull(aiMemoryEntries.deletedAt)))
      .orderBy(desc(aiMemoryEntries.importance))
      .limit(30),

    db.select({
      id: conversations.id,
      channel: conversations.channel,
      subject: conversations.subject,
      status: conversations.status,
      summary: conversations.summary,
      tone: conversations.tone,
      outcome: conversations.outcome,
      startedAt: conversations.startedAt,
      endedAt: conversations.endedAt,
      updatedAt: conversations.updatedAt,
    })
      .from(conversations)
      .where(and(eq(conversations.customerId, id), isNull(conversations.deletedAt)))
      .orderBy(desc(conversations.startedAt))
      .limit(20),

    db.select().from(aiFollowUps)
      .where(and(eq(aiFollowUps.customerId, id), isNull(aiFollowUps.deletedAt)))
      .orderBy(desc(aiFollowUps.generatedAt))
      .limit(10),
  ]);

  if (!customerRows[0]) notFound();

  const customer = customerRows[0];
  const memoryContext = memoryRows.map((m) => m.summary).join("\n");

  const [intelligenceProfile, riskAnalysis, recommendations] = await Promise.all([
    buildCustomerIntelligenceProfile(
      customer.displayName,
      memoryRows.map((m) => ({ kind: m.entryKind, summary: m.summary, importance: m.importance })),
      conversationRows.map((c) => c.summary ?? ""),
    ),
    analyzeDealRisk(
      { name: customer.displayName, company: customer.companyName, stage: customer.lifecycleStage, healthScore: customer.healthScore, sentiment: customer.sentiment, pricingRisk: customer.pricingRisk, acvCents: customer.annualContractValueCents },
      conversationRows.map((c) => c.summary ?? ""),
      memoryContext,
    ),
    generateRecommendations(
      { name: customer.displayName, company: customer.companyName, stage: customer.lifecycleStage, healthScore: customer.healthScore, sentiment: customer.sentiment, pricingRisk: customer.pricingRisk },
      memoryContext,
      conversationRows[0]?.summary ?? "No recent activity",
    ),
  ]);

  return (
    <CustomerDetailView
      customer={customer as any}
      memories={memoryRows as any}
      conversations={conversationRows as any}
      followUps={followUpRows as any}
      intelligenceProfile={intelligenceProfile}
      riskAnalysis={riskAnalysis}
      recommendations={recommendations}
    />
  );
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<LoadingState label="Loading customer intelligence..." />}>
      <CustomerDetailContent id={id} />
    </Suspense>
  );
}
