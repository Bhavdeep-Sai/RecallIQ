import { NextResponse } from "next/server";
import { reflectAndConsolidate } from "@/lib/services/memory";
import { getDb } from "@/lib/db/client";
import { aiMemoryEntries } from "@/lib/db/schema";
import { isNull } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { organizationId, customerId } = await req.json();

    let finalOrgId = organizationId;
    let finalCustomerId = customerId;

    if (!finalOrgId || !finalCustomerId) {
      const db = getDb();
      const [latest] = await db.select()
        .from(aiMemoryEntries)
        .where(isNull(aiMemoryEntries.deletedAt))
        .orderBy(aiMemoryEntries.createdAt)
        .limit(1);
        
      if (latest) {
        finalOrgId = latest.organizationId;
        finalCustomerId = latest.customerId;
      } else {
        return NextResponse.json({ error: "No active memories found to consolidate" }, { status: 400 });
      }
    }

    const result = await reflectAndConsolidate(finalOrgId, finalCustomerId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Reflection Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
