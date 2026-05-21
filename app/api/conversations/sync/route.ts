import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/client";
import { analyzeConversation } from "@/lib/services/sales-ai";

type ConversationRow = {
  id: string;
  organization_id: string;
  customer_id: string;
  summary: string | null;
};

type CustomerRow = {
  display_name: string | null;
};

type OrganizationRow = {
  id: string;
  metadata: Record<string, unknown> | null;
};

type SyncState = {
  lastConversationSyncAt?: string;
};

function getSyncState(metadata: Record<string, unknown> | null | undefined): SyncState {
  const candidate = metadata?.conversationSync;
  if (candidate && typeof candidate === "object") {
    return candidate as SyncState;
  }

  const legacyCandidate = metadata?.lastConversationSyncAt;
  if (typeof legacyCandidate === "string") {
    return { lastConversationSyncAt: legacyCandidate };
  }

  return {};
}

function toISOString(date: Date) {
  return date.toISOString();
}

function mergeMetadata(
  metadata: Record<string, unknown> | null | undefined,
  lastConversationSyncAt: string,
) {
  return {
    ...(metadata ?? {}),
    conversationSync: {
      ...(getSyncState(metadata) as Record<string, unknown>),
      lastConversationSyncAt,
    },
  };
}

export async function POST() {
  try {
    let supabase;
    try {
      supabase = getSupabaseAdmin();
    } catch (err) {
      console.error("/api/conversations/sync failed to create supabase admin client:", err);
      return NextResponse.json({ error: "Missing or invalid Supabase admin config", details: String(err) }, { status: 500 });
    }

    const { data: organizations, error: organizationsError } = await supabase
      .from("organizations")
      .select("id, metadata")
      .limit(50);

    if (organizationsError) {
      throw new Error(organizationsError.message);
    }

    const orgRows = (organizations ?? []) as OrganizationRow[];
    if (!orgRows.length) {
      return NextResponse.json({ error: "No organizations found to sync" }, { status: 400 });
    }

    const synced: Array<{ id: string; sentiment: string; summary: string; organizationId: string }> = [];
    let lastSyncAt = new Date(0).toISOString();

    for (const organization of orgRows) {
      const syncState = getSyncState(organization.metadata);
      const syncCursor = syncState.lastConversationSyncAt ?? new Date(0).toISOString();
      if (syncCursor > lastSyncAt) lastSyncAt = syncCursor;

      const { data: conversations, error: conversationError } = await supabase
        .from("conversations")
        .select("id, organization_id, customer_id, summary, updated_at, created_at")
        .eq("organization_id", organization.id)
        .is("deleted_at", null)
        .or(`updated_at.gt.${syncCursor},created_at.gt.${syncCursor}`)
        .order("updated_at", { ascending: false })
        .limit(5);

      if (conversationError) {
        // Log the full error object for debugging (but don't leak secrets)
        console.error("/api/conversations/sync supabase error:", conversationError);
        const envInfo = {
          supabaseUrlPresent: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseKeyPresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        };
        return NextResponse.json({ error: "Supabase query failed", details: conversationError, env: envInfo }, { status: 502 });
      }

      const rows = (conversations ?? []) as ConversationRow[];
      if (!rows.length) {
        continue;
      }

      for (const conversation of rows) {
        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .select("display_name")
          .eq("id", conversation.customer_id)
          .single();

        if (customerError) {
          throw new Error(customerError.message);
        }

        const customerRow = customer as CustomerRow;
        const analysis = await analyzeConversation(
          conversation.organization_id,
          conversation.customer_id,
          conversation.id,
          conversation.summary ?? "No conversation transcript available.",
          customerRow.display_name ?? "Customer",
        );

        synced.push({
          id: conversation.id,
          organizationId: organization.id,
          sentiment: analysis.tone ?? "neutral",
          summary: analysis.summary ?? "Synced conversation",
        });
      }
    }

    if (!synced.length) {
      return NextResponse.json({
        success: true,
        syncedCount: 0,
        message: "No new conversations to sync",
      });
    }

    const syncedAt = toISOString(new Date());

    for (const organization of orgRows) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from("organizations")
        .update({ metadata: mergeMetadata(organization.metadata, syncedAt) })
        .eq("id", organization.id);

      if (updateError) {
        console.error("/api/conversations/sync organization watermark update error:", updateError);
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: synced.length,
      synced,
      lastSyncAt,
      syncedAt,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const stack = error instanceof Error && error.stack ? error.stack : undefined;
    // Log full error server-side for debugging
    console.error("/api/conversations/sync error:", error);
    return NextResponse.json({ error: message, stack }, { status: 500 });
  }
}
