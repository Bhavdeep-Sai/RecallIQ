import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/client";

/**
 * GET /api/conversations
 * Returns all non-deleted conversations with customer names
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("conversations")
      .select(`
        id,
        channel,
        summary,
        tone,
        outcome,
        updated_at,
        customer:customers ( display_name )
      `)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);

    const conversations = (data ?? []).map((c: any) => ({
      id: c.id,
      customer: c.customer?.display_name ?? "Unknown customer",
      channel: c.channel,
      summary: c.summary,
      tone: c.tone,
      nextStep: c.outcome,
      updatedAt: c.updated_at,
    }));

    return NextResponse.json(conversations);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
