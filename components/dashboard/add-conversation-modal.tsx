"use client";

import { useState, useRef } from "react";
import { X, Loader2, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface AddConversationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customers: Array<{ id: string; company: string; name: string }>;
}

const CHANNELS = [
  { value: "call", label: "Phone Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "slack", label: "Slack" },
];

const TONES = [
  { value: "positive", label: "Positive" },
  { value: "price_sensitive", label: "Price-Sensitive" },
  { value: "guarded", label: "Guarded" },
  { value: "urgent", label: "Urgent" },
  { value: "neutral", label: "Neutral" },
];

type ConversationMessage = {
  senderType: "customer" | "user";
  senderName: string;
  content: string;
  sentiment: string | null;
};

export function AddConversationModal({
  open,
  onClose,
  onSuccess,
  customers,
}: AddConversationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<"form" | "messages">("form");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [selectedTone, setSelectedTone] = useState<string>("");
  const [summaryText, setSummaryText] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [outcome, setOutcome] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      // Build messages array
      const messages: ConversationMessage[] = [];

      // Customer message
      const customerName = formData.get("customerName");
      const customerMessage = formData.get("customerMessage");
      if (customerName && customerMessage) {
        messages.push({
          senderType: "customer",
          senderName: String(customerName),
          content: String(customerMessage),
          sentiment: String(formData.get("tone") || ""),
        });
      }

      // Rep message
      const repName = formData.get("repName");
      const repMessage = formData.get("repMessage");
      if (repName && repMessage) {
        messages.push({
          senderType: "user",
          senderName: String(repName),
          content: String(repMessage),
          sentiment: "positive",
        });
      }

      const payload = {
        customerId: String(formData.get("customerId") || ""),
        channel: String(formData.get("channel") || ""),
        subject: String(formData.get("subject") || ""),
        summary: String(formData.get("summary") || ""),
        tone: String(formData.get("tone") || ""),
        outcome: String(formData.get("outcome") || ""),
        messages,
      };

      // Validate required fields
      if (!payload.customerId) {
        setError("Please select a customer");
        setLoading(false);
        return;
      }
      if (!payload.channel) {
        setError("Please select a channel");
        setLoading(false);
        return;
      }
      if (!payload.summary?.trim()) {
        setError("Please enter a summary");
        setLoading(false);
        return;
      }
      if (!payload.tone) {
        setError("Please select a tone");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/conversations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create conversation");
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast.success(`✓ Conversation created! (${data.messageCount} messages)`);
      formRef.current?.reset();

      // reset controlled inputs
      setSelectedCustomerId("");
      setSelectedChannel("");
      setSelectedTone("");
      setSummaryText("");
      setSubject("");
      setOutcome("");

      setTimeout(() => {
        setSuccess(false);
        setStep("form");
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Network error";
      setError(errMsg);
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 h-screen"
        style={{ background: "rgba(0,0,0,0.55)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
        <div
          className="w-full max-w-2xl max-h-[calc(100vh-2rem)] h-[calc(100vh-2rem)] rounded-lg border shadow-lg flex flex-col overflow-hidden"
          style={{ background: "var(--bg-base)", borderColor: "var(--border-default)", color: "var(--text-muted)" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b p-5 flex-shrink-0"
            style={{ borderColor: "var(--border-default)" }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
                <MessageSquare className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Add Conversation</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {step === "form"
                    ? "Details about the conversation"
                    : "Messages exchanged"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 cursor-pointer rounded-lg transition flex-shrink-0"
              disabled={loading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content Area - Scrollable */}
          <div className="overflow-y-auto flex-1">
            {/* Success State */}
            {success && (
              <div className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-emerald-500/20">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-1">Conversation Created!</h3>
                <p className="text-sm text-slate-400">
                  Your conversation has been saved and will appear on the page shortly.
                </p>
              </div>
            )}

            {/* Form */}
            {!success && (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 p-6">
                {/* Error Alert */}
                {error && (
                  <div
                    className="p-3 rounded-lg border flex gap-3 items-start"
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      borderColor: "rgba(239, 68, 68, 0.3)",
                    }}
                  >
                    <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Step 1: Conversation Details */}
                {step === "form" && (
                  <div className="space-y-4">
                    {/* Customer Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Customer <span className="text-red-400">*</span>
                      </label>
                      <select
                        name="customerId"
                        required
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border text-sm"
                        style={{
                          background: "var(--bg-secondary)",
                          borderColor: "var(--border-default)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <option value="">Select a customer...</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.company} — {c.name}
                          </option>
                        ))}
                      </select>
                      {!customers.length && (
                        <p className="text-xs text-amber-400 mt-1">
                          No customers found. Please add a customer first.
                        </p>
                      )}
                    </div>

                    {/* Channel & Tone */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Channel <span className="text-red-400">*</span>
                        </label>
                        <select
                          name="channel"
                          required
                          value={selectedChannel}
                          onChange={(e) => setSelectedChannel(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border text-sm"
                          style={{
                            background: "var(--bg-secondary)",
                            borderColor: "var(--border-default)",
                            color: "var(--text-primary)",
                          }}
                        >
                          <option value="">Select channel...</option>
                          {CHANNELS.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Tone <span className="text-red-400">*</span>
                        </label>
                        <select
                          name="tone"
                          required
                          value={selectedTone}
                          onChange={(e) => setSelectedTone(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border text-sm"
                          style={{
                            background: "var(--bg-secondary)",
                            borderColor: "var(--border-default)",
                            color: "var(--text-primary)",
                          }}
                        >
                          <option value="">Select tone...</option>
                          {TONES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Subject</label>
                      <Input
                        type="text"
                        name="subject"
                        placeholder="e.g., Q3 pricing discussion"
                        className="text-sm"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>

                    {/* Summary */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Summary <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        name="summary"
                        placeholder="What was discussed in this conversation? (2-3 sentences)"
                        rows={3}
                        value={summaryText}
                        onChange={(e) => setSummaryText(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border text-sm resize-none"
                        style={{
                          background: "var(--bg-secondary)",
                          borderColor: "var(--border-default)",
                          color: "var(--text-primary)",
                        }}
                        required
                      />
                    </div>

                    {/* Outcome */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Next Step</label>
                      <Input
                        type="text"
                        name="outcome"
                        placeholder="e.g., Send pricing proposal, Schedule follow-up"
                        value={outcome}
                        onChange={(e) => setOutcome(e.target.value)}
                      />
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        onClick={onClose}
                        variant="outline"
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          // validate required fields before proceeding
                          if (!selectedCustomerId) {
                            setError("Please select a customer");
                            return;
                          }
                          if (!selectedChannel) {
                            setError("Please select a channel");
                            return;
                          }
                          if (!selectedTone) {
                            setError("Please select a tone");
                            return;
                          }
                          if (!summaryText?.trim()) {
                            setError("Please enter a summary");
                            return;
                          }
                          setError(null);
                          setStep("messages");
                        }}
                        disabled={loading}
                      >
                        Continue → Add Messages
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Messages */}
                {step === "messages" && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-400 mb-4">
                      Add the conversation between the customer and your team. At least one message is required.
                    </p>

                    {/* Customer Message */}
                    <div
                      className="p-4 rounded-lg border"
                      style={{
                        background: "var(--bg-secondary)",
                        borderColor: "var(--border-default)",
                      }}
                    >
                      <label className="block text-xs font-semibold text-blue-400 mb-3">
                        CUSTOMER SAYS
                      </label>
                      <Input
                        type="text"
                        name="customerName"
                        placeholder="Customer name"
                        className="mb-3 text-sm"
                      />
                      <textarea
                        name="customerMessage"
                        placeholder="What did the customer say?"
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border text-sm resize-none"
                        style={{
                          background: "var(--bg-primary)",
                          borderColor: "var(--border-default)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>

                    {/* Rep Message */}
                    <div
                      className="p-4 rounded-lg border"
                      style={{
                        background: "var(--bg-secondary)",
                        borderColor: "var(--border-default)",
                      }}
                    >
                      <label className="block text-xs font-semibold text-emerald-400 mb-3">
                        YOU RESPOND
                      </label>
                      <Input
                        type="text"
                        name="repName"
                        placeholder="Your name"
                        className="mb-3 text-sm"
                      />
                      <textarea
                        name="repMessage"
                        placeholder="What did you say in response?"
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border text-sm resize-none"
                        style={{
                          background: "var(--bg-primary)",
                          borderColor: "var(--border-default)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>

                    {/* Note */}
                    <div
                      className="p-3 rounded-lg text-xs"
                      style={{
                        background: "rgba(59, 130, 246, 0.1)",
                        borderLeft: "2px solid rgb(59, 130, 246)",
                        color: "var(--text-muted)",
                      }}
                    >
                      💡 <strong>Tip:</strong> Add at least one message exchange for better AI insights.
                    </div>

                    {/* Actions */}
                      {/* Hidden fields to preserve values from previous step */}
                      <input type="hidden" name="customerId" value={selectedCustomerId} />
                      <input type="hidden" name="channel" value={selectedChannel} />
                      <input type="hidden" name="tone" value={selectedTone} />
                      <input type="hidden" name="subject" value={subject} />
                      <input type="hidden" name="summary" value={summaryText} />
                      <input type="hidden" name="outcome" value={outcome} />

                      <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        onClick={() => setStep("form")}
                        variant="outline"
                        disabled={loading}
                      >
                        ← Back
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Conversation"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
