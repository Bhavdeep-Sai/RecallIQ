"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Loader2,
  Building2,
  Mail,
  Phone,
  Globe,
  DollarSign,
  User,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ─── Types ─────────────────────────────────────────────────────────────────

interface CustomerRecord {
  id: string;
  company: string;
  name: string;
  owner: string | null;
  pricingRisk: string | null;
  sentiment: string | null;
  healthScore: number | null;
  forecastValue: number | null;
  lastTouchpoint: string | null;
  stage: string | null;
}

// ─── Export CSV ────────────────────────────────────────────────────────────

function exportCSV(customers: CustomerRecord[]) {
  const headers = ["Company", "Contact", "Owner", "Stage", "Health Score", "Pricing Risk", "Forecast Value (USD)", "Last Touchpoint"];
  const rows = customers.map((c) => [
    c.company ?? "",
    c.name ?? "",
    c.owner ?? "",
    c.stage ?? "",
    String(c.healthScore ?? 0),
    c.pricingRisk ?? "",
    c.forecastValue ? ((c.forecastValue) / 100).toFixed(2) : "0.00",
    c.lastTouchpoint ? new Date(c.lastTouchpoint).toLocaleDateString() : "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `recalliq-customers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Add Customer Modal ─────────────────────────────────────────────────────

interface AddCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STAGES = [
  { value: "lead", label: "Lead" },
  { value: "qualified", label: "Qualified" },
  { value: "discovery", label: "Discovery" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "closed_won", label: "Closed Won" },
  { value: "closed_lost", label: "Closed Lost" },
];

const RISK_LEVELS = [
  { value: "low", label: "Low", color: "text-emerald-500" },
  { value: "medium", label: "Medium", color: "text-amber-500" },
  { value: "high", label: "High", color: "text-rose-500" },
];

function AddCustomerModal({ open, onClose, onSuccess }: AddCustomerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      displayName: formData.get("displayName"),
      companyName: formData.get("companyName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      website: formData.get("website"),
      lifecycleStage: formData.get("lifecycleStage"),
      annualContractValueCents: formData.get("acv"),
      pricingRisk: formData.get("pricingRisk"),
    };

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      formRef.current?.reset();
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
        onClose();
      }, 1200);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 backdrop-blur-sm"
        style={{ background: "rgba(0,0,0,0.55)" }}
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col overflow-hidden"
        style={{
          background: "var(--bg-overlay)",
          borderLeft: "1px solid var(--border-default)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-default)" }}>
              <Building2 className="h-4 w-4 text-cyan-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Add customer account</h2>
              <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>RecallIQ will start building memory for this account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--text-muted)" }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

          {/* Contact name */}
          <Field icon={<User className="h-3.5 w-3.5" />} label="Contact name *" htmlFor="displayName">
            <Input
              id="displayName"
              name="displayName"
              placeholder="Jordan Williams"
              required
              className="input-base w-full px-3 py-2 text-sm"
            />
          </Field>

          {/* Company name */}
          <Field icon={<Building2 className="h-3.5 w-3.5" />} label="Company *" htmlFor="companyName">
            <Input
              id="companyName"
              name="companyName"
              placeholder="Acme Corporation"
              required
              className="input-base w-full px-3 py-2 text-sm"
            />
          </Field>

          {/* Email */}
          <Field icon={<Mail className="h-3.5 w-3.5" />} label="Email" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jordan@acme.com"
              className="input-base w-full px-3 py-2 text-sm"
            />
          </Field>

          {/* Phone + Website side by side */}
          <div className="grid grid-cols-2 gap-3">
            <Field icon={<Phone className="h-3.5 w-3.5" />} label="Phone" htmlFor="phone">
              <Input
                id="phone"
                name="phone"
                placeholder="+1 (555) 000-0000"
                className="input-base w-full px-3 py-2 text-sm"
              />
            </Field>
            <Field icon={<Globe className="h-3.5 w-3.5" />} label="Website" htmlFor="website">
              <Input
                id="website"
                name="website"
                placeholder="acme.com"
                className="input-base w-full px-3 py-2 text-sm"
              />
            </Field>
          </div>

          {/* ACV */}
          <Field icon={<DollarSign className="h-3.5 w-3.5" />} label="Annual contract value (USD)" htmlFor="acv">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-faint)" }}>$</span>
              <Input
                id="acv"
                name="acv"
                type="number"
                min="0"
                step="1000"
                placeholder="50000"
                className="input-base w-full pl-7 pr-3 py-2 text-sm"
              />
            </div>
          </Field>

          {/* Lifecycle stage */}
          <Field icon={<TrendingUp className="h-3.5 w-3.5" />} label="Deal stage" htmlFor="lifecycleStage">
            <select
              id="lifecycleStage"
              name="lifecycleStage"
              defaultValue="lead"
              className="input-base w-full px-3 py-2 text-sm"
            >
              {STAGES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>

          {/* Pricing risk */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-primary)" }}>Pricing risk</label>
            <div className="grid grid-cols-3 gap-2">
              {RISK_LEVELS.map((r) => (
                <label
                  key={r.value}
                  className="flex items-center gap-2 rounded-xl p-2.5 cursor-pointer transition-colors"
                  style={{ border: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}
                >
                  <input type="radio" name="pricingRisk" value={r.value} defaultChecked={r.value === "low"} className="accent-green-500" />
                  <span className={`text-xs font-medium ${r.color}`}>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Info tip */}
          <div className="rounded-xl p-3 flex gap-2.5" style={{ background: "var(--info-bg)", border: "1px solid var(--info-border)" }}>
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "var(--info-text)" }} />
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              After adding this account, RecallIQ will start capturing memory from conversations automatically.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl p-3 flex gap-2" style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-border)" }}>
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--danger-text)" }} />
              <p className="text-sm" style={{ color: "var(--danger-text)" }}>{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="rounded-xl p-3 flex gap-2" style={{ background: "var(--success-bg)", border: "1px solid var(--success-border)" }}>
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--success-text)" }} />
              <p className="text-sm" style={{ color: "var(--success-text)" }}>Customer added successfully!</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 shrink-0" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            variant="gradient"
            disabled={loading || success}
            onClick={() => formRef.current?.requestSubmit()}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
            ) : success ? (
              <><CheckCircle2 className="h-4 w-4" /> Created!</>
            ) : (
              "Add customer"
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Main action bar exported as a client component ────────────────────────

interface CustomersActionsProps {
  customers: CustomerRecord[];
}

export function CustomersActions({ customers }: CustomersActionsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  function handleSuccess() {
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => exportCSV(customers)}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export snapshot
        </Button>
        <Button
          variant="gradient"
          onClick={() => setModalOpen(true)}
          className="gap-2"
        >
          Add account
        </Button>
      </div>

      <AddCustomerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}

// ─── Field helper ───────────────────────────────────────────────────────────

function Field({
  icon,
  label,
  htmlFor,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-xs font-medium"
        style={{ color: "var(--text-primary)" }}
      >
        {icon && <span style={{ color: "var(--text-faint)" }}>{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}
