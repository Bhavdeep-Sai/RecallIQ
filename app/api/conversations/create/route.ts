import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/client";

/**
 * POST /api/conversations/create
 * Creates a new conversation with messages
 * Body: { customerId, channel, subject, summary, tone, outcome, messages[] }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      channel,
      subject,
      summary,
      tone,
      outcome,
      messages = [],
    } = body;

    // Validation
    if (!customerId?.trim()) {
      return NextResponse.json(
        { error: "Customer is required" },
        { status: 400 }
      );
    }

    if (!["call", "email", "meeting", "slack"].includes(channel)) {
      return NextResponse.json(
        {
          error: "Invalid channel. Must be: call, email, meeting, or slack",
        },
        { status: 400 }
      );
    }

    if (!summary?.trim()) {
      return NextResponse.json(
        { error: "Conversation summary is required" },
        { status: 400 }
      );
    }

    if (!tone?.trim()) {
      return NextResponse.json(
        { error: "Tone is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 1. Get organization from customer
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .select("organization_id")
      .eq("id", customerId)
      .is("deleted_at", null)
      .single();

    if (custErr || !customer) {
      return NextResponse.json(
        { error: "Customer not found. Please select a valid customer." },
        { status: 404 }
      );
    }

    const organizationId = (customer as any).organization_id;

    // 2. Create conversation
    const { data: conversation, error: convErr } = await supabase
      .from("conversations")
      .insert({
        organization_id: organizationId,
        customer_id: customerId,
        channel,
        subject: subject?.trim() || summary.slice(0, 100),
        summary: summary.trim(),
        tone: tone.trim(),
        outcome: outcome?.trim() || null,
        status: "open",
        metadata: {},
      } as any)
      .select()
      .single();

    if (convErr) {
      console.error("Conversation insert error:", convErr);
      throw new Error("Failed to create conversation: " + convErr.message);
    }

    if (!conversation) {
      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      );
    }

    // 3. Insert messages if provided
    let messageCount = 0;
    if (messages.length > 0) {
      const conv = conversation as any;
      const messagesToInsert = messages.map((msg: any) => ({
        organization_id: organizationId,
        conversation_id: conv.id,
        customer_id: msg.senderType === "customer" ? customerId : null,
        sender_type: msg.senderType || "user",
        sender_name: msg.senderName?.trim() || "Unknown",
        content: msg.content?.trim() || "",
        sentiment: msg.sentiment?.trim() || null,
        content_format: "plain_text",
        metadata: {},
      }));

      const { error: msgErr } = await supabase
        .from("messages")
        .insert(messagesToInsert);

      if (msgErr) {
        console.error("Messages insert error:", msgErr);
        throw new Error("Failed to create messages: " + msgErr.message);
      }

      messageCount = messagesToInsert.length;
    }

    return NextResponse.json(
      {
        success: true,
        conversation,
        messageCount,
        message: `Conversation created successfully with ${messageCount} message(s)`,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
