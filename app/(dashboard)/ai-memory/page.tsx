import { ArrowUpRight, BrainCircuit, Tag, Clock, Percent, Shield, Link2, Filter, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/system/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { MemoryActions } from "@/components/dashboard/actions/memory-actions";
import { formatRelativeTime } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/db/client";

export default async function AiMemoryPage() {
  let memories: any[] = [];
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from("ai_memory_entries")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      
      memories = (data ?? []).map((entry: any) => ({
        id: entry.id,
        memoryKey: entry.memory_key,
        confidence: entry.confidence,
        summary: entry.summary,
        tags: entry.tags,
        createdAt: entry.created_at,
      }));
    } catch {
      // fallback to empty
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<BrainCircuit className="h-5 w-5" />}
        badge="Hindsight memory"
        title="AI Memory"
        description="RecallIQ stores objections, tone, pricing pressure, and customer context so every new conversation starts with retained understanding."
        actions={<MemoryActions />}
      />

      {/* Explainer */}
      <div className="rounded-xl p-4 flex gap-3" style={{ background: "var(--info-bg)", border: "1px solid var(--info-border)" }}>
        <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--info-text)" }} />
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>What is AI Memory? </span>
          Every time a customer mentions a concern, objection, or preference, RecallIQ saves it here. Next time your team talks to that customer, the AI already knows the context — no need to start from scratch.
        </p>
      </div>

      {!memories.length ? (
        <EmptyState
          actionLabel="Capture first memory"
          description="No memory artifacts are available yet. Once the product is wired to the API, these entries become durable customer context."
          icon={<BrainCircuit className="h-7 w-7" />}
          title="No memory stored yet"
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          {/* Memory timeline */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
              <Clock className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
              Memory timeline
              <Badge variant="secondary">{memories.length} entries</Badge>
            </h2>
            {memories.map((entry) => (
              <MemoryCard key={entry.id} entry={entry} />
            ))}
          </div>

          {/* Policies */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
              <Shield className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
              Memory policies
            </h2>
            <Card>
              <CardContent className="p-4 space-y-3">
                <PolicyRow
                  icon={<Filter className="h-4 w-4 text-cyan-400" />}
                  title="Tone retention"
                  description="Preserve customer tone, urgency, and sentiment across sessions."
                />
                <PolicyRow
                  icon={<Link2 className="h-4 w-4 text-violet-400" />}
                  title="Objection linking"
                  description="Attach pricing and security concerns to the current account timeline."
                />
                <PolicyRow
                  icon={<Percent className="h-4 w-4 text-emerald-400" />}
                  title="Confidence gating"
                  description="Only promote memory records above the configured confidence threshold."
                />
                <PolicyRow
                  icon={<Shield className="h-4 w-4 text-amber-400" />}
                  title="Traceability"
                  description="Every write emits source message IDs, route metadata, and operator context."
                />
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Memory health</CardTitle>
                <CardDescription>Confidence distribution across stored entries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "High confidence (>80%)", pct: 62, color: "bg-emerald-400" },
                  { label: "Medium (50–80%)",         pct: 28, color: "bg-amber-400" },
                  { label: "Low (<50%)",              pct: 10, color: "bg-rose-400" },
                ].map((row) => (
                  <div key={row.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{row.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
                      <div className={`h-1.5 rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function MemoryCard({ entry }: { entry: any }) {
  const confidence = Math.round((entry.confidence ?? 0) * 100);
  const confVariant = confidence >= 80 ? "success" : confidence >= 50 ? "warning" : "destructive";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-default)" }}>
              <BrainCircuit className="h-3.5 w-3.5 text-cyan-500" />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{entry.memoryKey}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={confVariant}>{confidence}%</Badge>
            <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>{formatRelativeTime(entry.createdAt)}</span>
          </div>
        </div>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-muted)" }}>{entry.summary}</p>
        {entry.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.tags.map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]"
                style={{ border: "1px solid var(--border-default)", background: "var(--bg-subtle)", color: "var(--text-muted)" }}
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PolicyRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl p-3" style={{ border: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{title}</p>
        <p className="text-xs leading-relaxed mt-0.5" style={{ color: "var(--text-muted)" }}>{description}</p>
      </div>
    </div>
  );
}
