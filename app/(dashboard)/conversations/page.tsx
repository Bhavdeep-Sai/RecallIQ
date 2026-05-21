"use client";

import { useState, useEffect } from "react";
import {
  MessagesSquare,
  Phone,
  Mail,
  Video,
  MessageCircle,
  Clock,
  ChevronRight,
  Plus,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/system/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { ConversationsActions } from "@/components/dashboard/actions/conversations-actions";
import { AddConversationModal } from "@/components/dashboard/add-conversation-modal";
import { formatRelativeTime } from "@/lib/format";

const channelConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  call:    { icon: <Phone className="h-3.5 w-3.5" />,         label: "Phone call",   color: "text-cyan-400 bg-cyan-500/10 border-cyan-400/20" },
  email:   { icon: <Mail className="h-3.5 w-3.5" />,          label: "Email",        color: "text-violet-400 bg-violet-500/10 border-violet-400/20" },
  meeting: { icon: <Video className="h-3.5 w-3.5" />,         label: "Meeting",      color: "text-emerald-400 bg-emerald-500/10 border-emerald-400/20" },
  slack:   { icon: <MessageCircle className="h-3.5 w-3.5" />, label: "Slack",        color: "text-amber-400 bg-amber-500/10 border-amber-400/20" },
};

const toneVariant: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  positive:        "success",
  "price_sensitive": "warning",
  guarded:         "secondary",
  urgent:          "destructive",
  neutral:         "secondary",
};

export default function ConversationsPage() {
  const [conversationRecords, setConversationRecords] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  // Fetch conversations and customers on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch conversations
        const convRes = await fetch("/api/conversations");
        if (convRes.ok) {
          const convData = await convRes.json();
          setConversationRecords(convData || []);
        }

        // Fetch customers and normalize fields for UI
        const custRes = await fetch("/api/customers");
        if (custRes.ok) {
          const custData = await custRes.json();
          const raw = custData.customers || [];
          // Normalize to { id, company, name }
          const normalized = raw.map((c: any) => ({
            id: c.id,
            company: c.company_name || c.company || "",
            name: c.display_name || c.name || "",
          }));
          setCustomers(normalized);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSuccess = () => {
    // Refresh conversations
    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/conversations");
        if (res.ok) {
          const data = await res.json();
          setConversationRecords(data || []);
        }
      } catch (error) {
        console.error("Error refreshing conversations:", error);
      }
    };
    fetchConversations();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<MessagesSquare className="h-5 w-5" />}
        badge="Conversation intelligence"
        title="Conversations"
        description="See how RecallIQ compresses call notes, email context, and meeting history into persistent sales memory."
        helpTitle="How to read this page"
        helpText="Each card is one conversation with a customer. The tone badge shows how the customer felt, and the next step tells you what to do next. Use this page to review context, summarize history, and jump back into the right follow-up action."
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Conversation
            </Button>
            <ConversationsActions />
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : !conversationRecords.length ? (
        <EmptyState
          actionLabel="Add your first conversation"
          description="No conversations recorded yet. Click 'Add Conversation' to create one, or sync from your CRM."
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

      {/* Add Conversation Modal */}
      <AddConversationModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={handleSuccess}
        customers={customers}
      />
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
