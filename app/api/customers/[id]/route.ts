import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/client";
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

  try {
    const supabase = getSupabaseAdmin();

    const p1 = supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .limit(1);

    const p2 = supabase
      .from("ai_memory_entries")
      .select("*")
      .eq("customer_id", id)
      .is("deleted_at", null)
      .order("importance", { ascending: false })
      .limit(30);

    const p3 = supabase
      .from("conversations")
      .select("id, channel, subject, status, summary, tone, outcome, started_at, ended_at, updated_at")
      .eq("customer_id", id)
      .is("deleted_at", null)
      .order("started_at", { ascending: false })
      .limit(20);

    const p4 = supabase
      .from("ai_follow_ups")
      .select("*")
      .eq("customer_id", id)
      .is("deleted_at", null)
      .order("generated_at", { ascending: false })
      .limit(10);

    const [r1, r2, r3, r4] = await Promise.all([p1, p2, p3, p4]);

    if (r1.error) return NextResponse.json({ error: r1.error.message }, { status: 500 });

    const customerRow = (r1.data ?? [])[0];
    if (!customerRow) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    return NextResponse.json({
      customer: customerRow,
      memories: r2.data ?? [],
      conversations: r3.data ?? [],
      followUps: r4.data ?? [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
