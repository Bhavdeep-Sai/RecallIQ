import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/client";

type SettingsPayload = {
  workspaceName: string;
  primaryDomain: string;
  supportInbox: string;
  timezone: string;
};

type OrganizationRow = {
  id: string;
  name: string;
  timezone: string;
  metadata: Record<string, unknown> | null;
};

async function getWorkspace() {
  const supabase = getSupabaseAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("organizations")
    .select("id, name, timezone, metadata")
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const workspace = data?.[0] as OrganizationRow | undefined;
  if (!workspace) {
    throw new Error("No organization found. Please seed demo data first.");
  }

  return workspace;
}

function toSettings(workspace: OrganizationRow): SettingsPayload {
  const metadata = workspace.metadata ?? {};
  return {
    workspaceName: workspace.name,
    primaryDomain: String(metadata.primary_domain ?? "recalliq.ai"),
    supportInbox: String(metadata.support_inbox ?? "support@recalliq.ai"),
    timezone: workspace.timezone || "UTC",
  };
}

export async function GET() {
  try {
    const workspace = await getWorkspace();
    return NextResponse.json({ settings: toSettings(workspace) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<SettingsPayload>;
    const workspaceName = body.workspaceName?.trim();
    const primaryDomain = body.primaryDomain?.trim();
    const supportInbox = body.supportInbox?.trim();
    const timezone = body.timezone?.trim();

    if (!workspaceName) {
      return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
    }
    if (!primaryDomain) {
      return NextResponse.json({ error: "Primary domain is required" }, { status: 400 });
    }
    if (!supportInbox) {
      return NextResponse.json({ error: "Support inbox is required" }, { status: 400 });
    }
    if (!timezone) {
      return NextResponse.json({ error: "Timezone is required" }, { status: 400 });
    }

    const workspace = await getWorkspace();
    const supabase = getSupabaseAdmin();
    const nextMetadata = {
      ...(workspace.metadata ?? {}),
      primary_domain: primaryDomain,
      support_inbox: supportInbox,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("organizations")
      .update({
        name: workspaceName,
        timezone,
        metadata: nextMetadata,
      })
      .eq("id", workspace.id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      settings: {
        workspaceName,
        primaryDomain,
        supportInbox,
        timezone,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
