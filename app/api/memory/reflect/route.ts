import { NextResponse } from "next/server";
import { reflectAndConsolidate } from "@/lib/services/memory";
import { getSupabaseAdmin } from "@/lib/db/client";

type MemoryTargetRow = {
  organization_id: string;
  customer_id: string;
};

export async function POST(req: Request) {
  try {
    const { organizationId, customerId } = await req.json();

    let finalOrgId = organizationId;
    let finalCustomerId = customerId;

    if (!finalOrgId || !finalCustomerId) {
      const supabase = getSupabaseAdmin();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: latestRows, error } = await (supabase as any)
        .from("ai_memory_entries")
        .select("organization_id, customer_id")
        .is("deleted_at", null)
        .not("customer_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        throw new Error(`Failed to resolve memory target: ${error.message}`);
      }

      const latest = latestRows?.[0] as MemoryTargetRow | undefined;
        
      if (latest) {
        finalOrgId = latest.organization_id;
        finalCustomerId = latest.customer_id;
      } else {
        return NextResponse.json({ error: "No active memories found to consolidate" }, { status: 400 });
      }
    }

    const result = await reflectAndConsolidate(finalOrgId, finalCustomerId);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Reflection Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
