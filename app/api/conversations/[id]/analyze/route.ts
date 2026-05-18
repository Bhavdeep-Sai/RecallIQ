import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { conversations, customers, messages } from "@/lib/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { analyzeConversation } from "@/lib/services/sales-ai";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const organizationId: string = body.organizationId ?? "demo-org";

    if (!process.env.DATABASE_URL) {
      // Demo mode — return mock analysis
      return NextResponse.json({
        sentiment: { label: "positive", score: 0.72, summary: "Customer is engaged and interested", signals: ["mentioned timeline", "asked about pricing"] },
        buyingSignals: { signals: [{ type: "pricing_inquiry", strength: "moderate", evidence: "Asked about enterprise pricing", recommendation: "Send pricing deck" }], overallReadiness: 65, nextBestAction: "Send a tailored proposal" },
        objections: [{ category: "pricing", objection: "Budget is tight this quarter", severity: "medium", suggestedResponse: "Offer a phased rollout to spread cost", memoryContext: "Previously mentioned Q4 budget freeze" }],
        summary: "Productive discovery call. Customer is evaluating options and has budget concerns for Q4.",
        tone: "positive",
        keyInsights: ["Budget decision in Q1", "Champion is the VP of Sales", "Competitor evaluation ongoing"],
        suggestedNextStep: "Send a ROI calculator and schedule a technical demo",
      });
    }

    const db = getDb();

    // Load conversation + messages
    const [convRow] = await db.select()
      .from(conversations)
      .where(and(eq(conversations.id, id), isNull(conversations.deletedAt)))
      .limit(1);

    if (!convRow) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const [customerRow] = await db.select()
      .from(customers)
      .where(and(eq(customers.id, convRow.customerId), isNull(customers.deletedAt)))
      .limit(1);

    const messageRows = await db.select()
      .from(messages)
      .where(and(eq(messages.conversationId, id), isNull(messages.deletedAt)))
      .orderBy(desc(messages.occurredAt))
      .limit(50);

    const conversationText = messageRows
      .reverse()
      .map((m) => `[${m.senderType.toUpperCase()}]: ${m.content}`)
      .join("\n");

    const analysis = await analyzeConversation(
      organizationId,
      convRow.customerId,
      id,
      conversationText || convRow.summary || "No conversation content available.",
      customerRow?.displayName ?? "Customer",
    );

    return NextResponse.json(analysis);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
