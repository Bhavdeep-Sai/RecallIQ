import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/client";

/**
 * GET /api/customers
 * Returns all non-deleted customers with their owner's name.
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("customers")
      .select(`
        id,
        display_name,
        company_name,
        email,
        lifecycle_stage,
        lifecycle_score,
        health_score,
        sentiment,
        pricing_risk,
        annual_contract_value_cents,
        updated_at,
        created_at,
        owner:team_members ( full_name )
      `)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);

    // Flatten owner join
    const customers = (data ?? []).map((c: any) => ({
      ...c,
      ownerName: c.owner?.full_name ?? null,
      owner: undefined,
    }));

    return NextResponse.json({ customers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/customers
 * Creates a new customer account.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      displayName,
      companyName,
      email,
      phone,
      website,
      lifecycleStage = "lead",
      annualContractValueCents = 0,
      pricingRisk = "low",
    } = body;

    if (!displayName?.trim()) {
      return NextResponse.json({ error: "Contact name is required" }, { status: 400 });
    }
    if (!companyName?.trim()) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Get the first active organization
    const { data: orgs, error: orgErr } = await supabase
      .from("organizations")
      .select("id")
      .is("deleted_at", null)
      .limit(1);

    if (orgErr) throw new Error(orgErr.message);
    if (!orgs?.length) {
      return NextResponse.json(
        { error: "No organization found. Please run: node scripts/seed-demo.mjs" },
        { status: 400 },
      );
    }

    const orgId = (orgs[0] as any).id;
    const acvCents = Math.round(Number(annualContractValueCents) * 100); // USD → cents

    const { data: newCustomer, error: insertErr } = await supabase
      .from("customers")
      .insert({
        organization_id: orgId,
        display_name: displayName.trim(),
        company_name: companyName.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        website: website?.trim() || null,
        lifecycle_stage: lifecycleStage,
        annual_contract_value_cents: acvCents,
        pricing_risk: pricingRisk,
        health_score: 50,
        lifecycle_score: 50,
        metadata: {},
      } as any)
      .select()
      .single();

    if (insertErr) throw new Error(insertErr.message);

    return NextResponse.json({ customer: newCustomer }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
