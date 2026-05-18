import { NextResponse } from "next/server";
import { getAnalyticsOverview } from "@/lib/services/analytics";

export async function GET() {
  try {
    const data = await getAnalyticsOverview();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
