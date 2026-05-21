import {
  Users,
  TrendingUp,
  Heart,
  Clock,
  DollarSign,
  UserCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/system/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { CustomersActions } from "@/components/dashboard/customers-actions";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/db/client";

export default async function CustomersPage() {
  let customerRecords: any[] = [];
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from("customers")
        .select(`
          id,
          company_name,
          display_name,
          pricing_risk,
          sentiment,
          health_score,
          annual_contract_value_cents,
          updated_at,
          lifecycle_stage,
          owner:team_members ( full_name )
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      customerRecords = (data ?? []).map((c: any) => ({
        id: c.id,
        company: c.company_name,
        name: c.display_name,
        owner: c.owner?.full_name ?? null,
        pricingRisk: c.pricing_risk,
        sentiment: c.sentiment,
        healthScore: c.health_score,
        forecastValue: c.annual_contract_value_cents,
        lastTouchpoint: c.updated_at,
        stage: c.lifecycle_stage,
      }));
    } catch {
      // fallback
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Users className="h-5 w-5" />}
        badge="Customer intelligence"
        title="Customers"
        description="Track account health, deal risk, and the context RecallIQ remembers across every customer session."
        helpTitle="How to read this page"
        helpText="Each card represents one customer account. The health score shows engagement, pricing risk shows likely pushback, and the forecast is the expected deal value. Use this page to prioritize accounts and understand which ones need attention first."
        actions={
          <CustomersActions customers={customerRecords} />
        }
      />

      {!customerRecords.length ? (
        <EmptyState
          actionLabel="Add your first customer"
          description="No customer records exist yet. Once data syncs, this view will surface health scores, forecast values, and memory-backed next steps."
          icon={<Users className="h-7 w-7" />}
          title="No customers yet"
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {customerRecords.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      )}
    </div>
  );
}

function CustomerCard({ customer }: { customer: any }) {
  const riskVariant =
    customer.pricingRisk === "high"
      ? "destructive"
      : customer.pricingRisk === "medium"
      ? "warning"
      : "success";

  const healthColor =
    customer.healthScore >= 70
      ? "text-emerald-500"
      : customer.healthScore >= 40
      ? "text-amber-500"
      : "text-rose-500";

  const healthBg =
    customer.healthScore >= 70
      ? "bg-emerald-400"
      : customer.healthScore >= 40
      ? "bg-amber-400"
      : "bg-rose-400";

  const initial = customer.company?.charAt(0) ?? "?";

  return (
    <Card>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm text-cyan-500"
              style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-default)" }}
            >
              {initial}
            </div>
            <div>
              <h3 className="font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>{customer.company}</h3>
              <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <UserCircle className="h-3 w-3" />
                {customer.name}
                {customer.owner ? ` · ${customer.owner}` : ""}
              </p>
            </div>
          </div>
          <Badge variant={riskVariant}>
            {customer.pricingRisk} risk
          </Badge>
        </div>

        {/* Sentiment */}
        {customer.sentiment && (
          <p className="text-sm leading-relaxed mb-4 line-clamp-2" style={{ color: "var(--text-muted)" }}>
            {customer.sentiment}
          </p>
        )}

        {/* Health bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <Heart className="h-3 w-3" /> Health score
            </span>
            <span className={`text-xs font-bold ${healthColor}`}>
              {customer.healthScore ?? 0}/100
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
            <div
              className={`h-1.5 rounded-full ${healthBg} transition-all`}
              style={{ width: `${customer.healthScore ?? 0}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <StatTile
            icon={<DollarSign className="h-3.5 w-3.5" />}
            label="Forecast"
            value={formatCurrency((customer.forecastValue || 0) / 100)}
          />
          <StatTile
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Last touch"
            value={formatRelativeTime(customer.lastTouchpoint)}
          />
          <StatTile
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label="Stage"
            value={customer.stage ?? "—"}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl p-2.5" style={{ border: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}>
      <div className="flex items-center gap-1 mb-1" style={{ color: "var(--text-muted)" }}>
        {icon}
        <span className="text-[10px] uppercase tracking-wide font-medium">{label}</span>
      </div>
      <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}
