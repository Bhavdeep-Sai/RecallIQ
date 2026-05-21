import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/client";

export type NotificationKind =
  | "conversation"
  | "follow_up"
  | "escalation"
  | "memory"
  | "budget"
  | "system";

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  text: string;
  /** ISO string */
  createdAt: string;
  /** Optional deep-link */
  href?: string;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return `${Math.floor(diffHr / 24)}d`;
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // last 7 days

    const [
      { data: convRows },
      { data: followUpRows },
      { data: escalationRows },
      { data: memoryRows },
      { data: budgetRows },
      { data: spendRows },
    ] = await Promise.all([
      // Recent conversations
      sb
        .from("conversations")
        .select("id, summary, tone, created_at, customer_id")
        .is("deleted_at", null)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(3),

      // Pending follow-ups due soon or overdue
      sb
        .from("ai_follow_ups")
        .select("id, title, status, due_at, confidence, created_at")
        .is("deleted_at", null)
        .in("status", ["draft", "queued"])
        .order("due_at", { ascending: true })
        .limit(3),

      // Open escalations
      sb
        .from("escalation_events")
        .select("id, severity, reason, summary, created_at")
        .is("deleted_at", null)
        .in("status", ["open", "investigating"])
        .order("created_at", { ascending: false })
        .limit(3),

      // Recent high-importance memory entries
      sb
        .from("ai_memory_entries")
        .select("id, entry_kind, summary, importance, created_at")
        .is("deleted_at", null)
        .gte("importance", 80)
        .gte("created_at", since)
        .order("importance", { ascending: false })
        .limit(3),

      // Active budget limits
      sb
        .from("budget_limits")
        .select("id, name, hard_limit_cents, soft_limit_cents, warn_threshold, created_at")
        .is("deleted_at", null)
        .eq("active", true)
        .limit(3),

      // This month's spend
      sb
        .from("token_usage_logs")
        .select("cost_cents")
        .is("deleted_at", null)
        .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ]);

    const notifications: Notification[] = [];

    // ── Escalations (highest priority) ──────────────────────────────────────
    for (const e of (escalationRows ?? []) as Array<{ id: string; severity: string; reason: string; summary: string; created_at: string }>) {
      notifications.push({
        id: `esc-${e.id}`,
        kind: "escalation",
        title: `${e.severity === "critical" ? "🚨 Critical" : e.severity === "high" ? "⚠️ High" : "⚡"} escalation — ${e.reason}`,
        text: e.summary,
        createdAt: e.created_at,
        href: "/runtime-intelligence",
      });
    }

    // ── Budget alerts ────────────────────────────────────────────────────────
    const totalSpendCents = ((spendRows ?? []) as Array<{ cost_cents: number }>)
      .reduce((s, r) => s + (r.cost_cents ?? 0), 0);

    for (const b of (budgetRows ?? []) as Array<{ id: string; name: string; hard_limit_cents: number; soft_limit_cents: number | null; warn_threshold: number; created_at: string }>) {
      const pct = b.hard_limit_cents > 0 ? totalSpendCents / b.hard_limit_cents : 0;
      if (pct >= b.warn_threshold) {
        notifications.push({
          id: `budget-${b.id}`,
          kind: "budget",
          title: `Budget alert — ${b.name}`,
          text: `${Math.round(pct * 100)}% of the ${b.name} budget used ($${(totalSpendCents / 100).toFixed(2)} of $${(b.hard_limit_cents / 100).toFixed(0)}).`,
          createdAt: new Date().toISOString(),
          href: "/analytics",
        });
      }
    }

    // ── Follow-ups ───────────────────────────────────────────────────────────
    for (const f of (followUpRows ?? []) as Array<{ id: string; title: string; status: string; due_at: string | null; confidence: number; created_at: string }>) {
      const isOverdue = f.due_at && new Date(f.due_at) < new Date();
      notifications.push({
        id: `fu-${f.id}`,
        kind: "follow_up",
        title: isOverdue ? `Overdue follow-up: ${f.title}` : `Follow-up ready: ${f.title}`,
        text: isOverdue
          ? `This follow-up was due ${relativeTime(f.due_at!)} ago and is still in "${f.status}" status.`
          : `AI-generated follow-up (${Math.round((f.confidence ?? 0.8) * 100)}% confidence) is waiting for your review.`,
        createdAt: f.due_at ?? f.created_at,
        href: "/follow-ups",
      });
    }

    // ── High-importance memory entries ───────────────────────────────────────
    for (const m of (memoryRows ?? []) as Array<{ id: string; entry_kind: string; summary: string; importance: number; created_at: string }>) {
      notifications.push({
        id: `mem-${m.id}`,
        kind: "memory",
        title: `New ${m.entry_kind} memory captured`,
        text: m.summary,
        createdAt: m.created_at,
        href: "/ai-memory",
      });
    }

    // ── Recent conversations ─────────────────────────────────────────────────
    for (const c of (convRows ?? []) as Array<{ id: string; summary: string | null; tone: string | null; created_at: string }>) {
      const toneLabel = c.tone ? ` (${c.tone} tone)` : "";
      notifications.push({
        id: `conv-${c.id}`,
        kind: "conversation",
        title: `New conversation logged${toneLabel}`,
        text: c.summary ? c.summary.slice(0, 120) + (c.summary.length > 120 ? "…" : "") : "A conversation was added to your workspace.",
        createdAt: c.created_at,
        href: "/conversations",
      });
    }

    // Sort by newest first and cap at 10
    const sorted = notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return NextResponse.json({ notifications: sorted, total: sorted.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message, notifications: [] }, { status: 500 });
  }
}
