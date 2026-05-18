import {
  ArrowUpRight,
  MessagesSquare,
  Phone,
  Mail,
  Video,
  MessageCircle,
  Clock,
  ChevronRight,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/system/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { ConversationsActions } from "@/components/dashboard/actions/conversations-actions";
import { formatRelativeTime } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/db/client";

const channelConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  call:    { icon: <Phone className="h-3.5 w-3.5" />,         label: "Phone call",   color: "text-cyan-400 bg-cyan-500/10 border-cyan-400/20" },
  email:   { icon: <Mail className="h-3.5 w-3.5" />,          label: "Email",        color: "text-violet-400 bg-violet-500/10 border-violet-400/20" },
  meeting: { icon: <Video className="h-3.5 w-3.5" />,         label: "Meeting",      color: "text-emerald-400 bg-emerald-500/10 border-emerald-400/20" },
  slack:   { icon: <MessageCircle className="h-3.5 w-3.5" />, label: "Slack",        color: "text-amber-400 bg-amber-500/10 border-amber-400/20" },
};

const toneVariant: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  positive:        "success",
  "price-sensitive": "warning",
  guarded:         "secondary",
  urgent:          "destructive",
  neutral:         "secondary",
};

export default async function ConversationsPage() {
  let conversationRecords: any[] = [];
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from("conversations")
        .select(`
          id, channel, summary, tone, outcome, updated_at,
          customer:customers ( display_name )
        `)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false });

      conversationRecords = (data ?? []).map((c: any) => ({
        id: c.id,
        customer: c.customer?.display_name ?? null,
        channel: c.channel,
        summary: c.summary,
        tone: c.tone,
        nextStep: c.outcome,
        updatedAt: c.updated_at,
      }));
    } catch {
      // DB unreachable
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<MessagesSquare className="h-5 w-5" />}
        badge="Conversation intelligence"
        title="Conversations"
        description="See how RecallIQ compresses call notes, email context, and meeting history into persistent sales memory."
        actions={<ConversationsActions />}
      />

      {/* Beginner helper */}
      <div className="rounded-xl border border-blue-400/15 bg-blue-500/8 p-4 flex gap-3">
        <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-400 leading-relaxed">
          <span className="text-slate-200 font-medium">How to read this: </span>
          Each card is one conversation with a customer. The tone badge shows how the customer felt (positive, guarded, price-sensitive). The "Next step" tells you what to do next.
        </p>
      </div>

      {!conversationRecords.length ? (
        <EmptyState
          actionLabel="Import conversations"
          description="Conversation records are empty. Once connected, this view will highlight sentiment, objections, and next best actions."
          icon={<MessagesSquare className="h-7 w-7" />}
          title="No conversations yet"
        />
      ) : (
        <div className="space-y-3">
          {conversationRecords.map((conv) => (
            <ConversationCard key={conv.id} conversation={conv} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationCard({ conversation }: { conversation: any }) {
  const channel = channelConfig[conversation.channel] ?? channelConfig.call;
  const tone = conversation.tone ?? "neutral";

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Channel icon */}
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${channel.color}`}>
            {channel.icon}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h3 className="font-semibold text-white leading-snug">
                  {conversation.customer ?? "Unknown customer"}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  {channel.icon}
                  <span>{channel.label}</span>
                  <span className="text-slate-600">·</span>
                  <Clock className="h-3 w-3" />
                  <span>{formatRelativeTime(conversation.updatedAt)}</span>
                </p>
              </div>
              <Badge variant={toneVariant[tone] ?? "secondary"}>
                {tone}
              </Badge>
            </div>

            {/* Summary */}
            <p className="text-sm leading-relaxed text-slate-400 mb-3 line-clamp-2">
              {conversation.summary || "No summary available for this conversation."}
            </p>

            {/* Next step */}
            {conversation.nextStep && (
              <div className="flex items-start gap-2 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5">
                <ChevronRight className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium block mb-0.5">
                    Next step
                  </span>
                  <p className="text-xs text-slate-300">{conversation.nextStep}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
