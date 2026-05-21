import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/client";
import { analyzeConversation } from "@/lib/services/sales-ai";

type ConversationRow = {
  id: string;
  customer_id: string;
  organization_id: string;
  summary: string | null;
};

type CustomerRow = {
  display_name: string | null;
};

type MessageRow = {
  sender_type: string;
  content: string;
  occurred_at: string;
};

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

    const supabase = getSupabaseAdmin();

    // Load conversation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: convRows, error: convError } = await (supabase as any)
      .from("conversations")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .limit(1);

    if (convError) throw new Error(convError.message);
    const convRow = ((convRows ?? []) as ConversationRow[])[0];
    if (!convRow) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: customerRows, error: customerError } = await (supabase as any)
      .from("customers")
      .select("*")
      .eq("id", convRow.customer_id)
      .is("deleted_at", null)
      .limit(1);
    if (customerError) throw new Error(customerError.message);

    const customerRow = ((customerRows ?? []) as CustomerRow[])[0];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: messageRows, error: messagesError } = await (supabase as any)
      .from("messages")
      .select("sender_type, content, occurred_at")
      .eq("conversation_id", id)
      .is("deleted_at", null)
      .order("occurred_at", { ascending: false })
      .limit(50);

    if (messagesError) throw new Error(messagesError.message);

    const conversationText = ((messageRows ?? []) as MessageRow[])
      .reverse()
      .map((m) => `[${m.sender_type.toUpperCase()}]: ${m.content}`)
      .join("\n");

    const analysis = await analyzeConversation(
      organizationId,
      convRow.customer_id,
      id,
      conversationText || convRow.summary || "No conversation content available.",
      customerRow?.display_name ?? "Customer",
    );

    return NextResponse.json(analysis);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
