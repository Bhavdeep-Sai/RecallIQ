import { NextResponse } from "next/server";
import { ingestMemory } from "@/lib/services/memory";

export async function POST(req: Request) {
  try {
    const { organizationId, customerId, conversationId, messageId, messageContent } = await req.json();

    if (!organizationId || !customerId || !messageContent) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const insertedMemories = await ingestMemory(
      organizationId,
      customerId,
      conversationId,
      messageId,
      messageContent
    );

    return NextResponse.json({ success: true, memories: insertedMemories });
  } catch (error: any) {
    console.error("Ingestion Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
