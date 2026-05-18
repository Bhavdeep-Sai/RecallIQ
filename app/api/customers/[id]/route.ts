import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import {
  customers,
  teamMembers,
  conversations,
  aiMemoryEntries,
  aiFollowUps,
  messages,
} from "@/lib/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "No database" }, { status: 503 });
  }

  try {
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

      db.select()
        .from(aiMemoryEntries)
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

      db.select()
        .from(aiFollowUps)
        .where(and(eq(aiFollowUps.customerId, id), isNull(aiFollowUps.deletedAt)))
        .orderBy(desc(aiFollowUps.generatedAt))
        .limit(10),
    ]);

    if (!customerRows[0]) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({
      customer: customerRows[0],
      memories: memoryRows,
      conversations: conversationRows,
      followUps: followUpRows,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
