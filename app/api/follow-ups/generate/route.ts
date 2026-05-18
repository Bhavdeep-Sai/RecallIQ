import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { conversations, customers } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { generateFollowUpEmail, saveFollowUp } from "@/lib/services/sales-ai";
import { injectMemory } from "@/lib/services/memory";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      organizationId = "demo-org",
      customerId,
      conversationId,
      senderName = "Your Sales Rep",
      urgency = "medium",
    } = body;

    let finalCustomerId = customerId;
    let finalConversationId = conversationId;

    if (!finalCustomerId) {
      const db = getDb();
      const [latest] = await db.select()
        .from(conversations)
        .where(isNull(conversations.deletedAt))
        .orderBy(conversations.startedAt)
        .limit(1);
      
      if (latest) {
        finalCustomerId = latest.customerId;
        finalConversationId = latest.id;
      } else {
        return NextResponse.json({ error: "No customers or conversations found to generate follow-up" }, { status: 400 });
      }
    }

    // Demo mode
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        followUp: {
          subject: "Following up on our conversation — RecallIQ demo",
          body: `Hi there,\n\nThank you for taking the time to speak with us. I wanted to follow up on the key points we discussed.\n\nBased on your interest in improving sales efficiency, I think RecallIQ could be a strong fit for your team.\n\nWould you be open to a 30-minute technical demo next week?\n\nBest,\n${senderName}`,
          tone: "friendly",
          personalizationNotes: ["Referenced previous conversation", "Addressed efficiency concern"],
          confidence: 0.85,
          rationale: "Demo mode — using template follow-up",
        },
        savedId: null,
      });
    }

    const db = getDb();

    // Load customer + conversation
    const [customerRow] = await db.select()
      .from(customers)
      .where(and(eq(customers.id, finalCustomerId), isNull(customers.deletedAt)))
      .limit(1);

    if (!customerRow) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    let conversationSummary = "No recent conversation available.";
    if (conversationId) {
      const [convRow] = await db.select()
        .from(conversations)
        .where(and(eq(conversations.id, finalConversationId), isNull(conversations.deletedAt)))
        .limit(1);
      if (convRow?.summary) conversationSummary = convRow.summary;
    }

    // Get memory context
    const memoryContext = await injectMemory(
      organizationId,
      finalCustomerId,
      conversationSummary,
    );

    const followUp = await generateFollowUpEmail(
      customerRow.displayName,
      customerRow.companyName,
      conversationSummary,
      memoryContext,
      senderName,
      urgency,
    );

    // Persist to DB
    const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // due in 24h
    const savedId = finalConversationId
      ? await saveFollowUp(organizationId, finalCustomerId, finalConversationId, followUp, dueAt)
      : null;

    return NextResponse.json({ followUp, savedId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
