import {
  Settings2,
  Building2,
  Shield,
  Plug,
  CheckCircle2,
  Globe,
  Mail,
  BrainCircuit,
  DollarSign,
  Eye,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/dashboard/page-header";
import { Separator } from "@/components/ui/separator";
import { SettingsActions } from "@/components/dashboard/actions/settings-actions";
import { SettingsLinks } from "@/components/dashboard/actions/settings-links";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Settings2 className="h-5 w-5" />}
        badge="Workspace settings"
        title="Settings"
        description="Configure organization details, memory behavior, and runtime policy thresholds."
        helpTitle="Workspace settings"
        helpText="These controls affect the entire workspace. Use this page to manage branding, support contact details, runtime policy toggles, and integration notes for your team."
        actions={<SettingsActions />}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">

        {/* Workspace profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-cyan-400" />
              Workspace profile
            </CardTitle>
            <CardDescription>
              Control branding, support contact, and account metadata
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              id="workspace-name"
              icon={<Building2 className="h-3.5 w-3.5" />}
              label="Workspace name"
              hint="The name shown across the platform"
              defaultValue="RecallIQ Sales OS"
            />
            <FormField
              id="primary-domain"
              icon={<Globe className="h-3.5 w-3.5" />}
              label="Primary domain"
              hint="Your organization's main domain"
              defaultValue="recalliq.ai"
            />
            <FormField
              id="support-inbox"
              icon={<Mail className="h-3.5 w-3.5" />}
              label="Support inbox"
              hint="Where support requests are routed"
              defaultValue="support@recalliq.ai"
            />

            <Separator />
            <SettingsLinks />
          </CardContent>
        </Card>

        {/* Policy controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-violet-400" />
              Policy controls
            </CardTitle>
            <CardDescription>
              Toggle AI memory and runtime features on or off
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <PolicyToggle
              icon={<BrainCircuit className="h-4 w-4 text-cyan-400" />}
              title="Hindsight memory"
              description="Store conversation summaries and objection history across sessions."
              enabled
            />
            <PolicyToggle
              icon={<DollarSign className="h-4 w-4 text-amber-400" />}
              title="Budget enforcement"
              description="Stop expensive routes when spend approaches the monthly cap."
              enabled
            />
            <PolicyToggle
              icon={<Eye className="h-4 w-4 text-violet-400" />}
              title="Trace collection"
              description="Capture route, latency, and memory write spans for debugging."
              enabled
            />
            <PolicyToggle
              icon={<Lock className="h-4 w-4 text-emerald-400" />}
              title="AI safety posture"
              description="Log all memory writes and show confidence scoring in operator views."
              enabled
            />
          </CardContent>
        </Card>
      </div>

      {/* Integration notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-4 w-4 text-cyan-400" />
            Integration notes
          </CardTitle>
          <CardDescription>
            Production endpoints are wired through the service abstractions in this foundation. Use this space for team notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            className="font-mono text-xs"
            rows={5}
            defaultValue={[
              "Supabase service client — memory storage and vector search",
              "Clerk — identity, session protection, and role-aware access",
              "React Query — hydrated server state with stale-while-revalidate",
              "Zustand — lightweight UI state (sidebar, modals)",
              "Cascadeflow — model routing, budget guardrails, observability",
            ].join("\n")}
          />
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            All integrations are configured and operational
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FormField({
  id,
  label,
  hint,
  defaultValue,
  icon,
}: {
  id: string;
  label: string;
  hint: string;
  defaultValue: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
        {icon && <span className="text-slate-500">{icon}</span>}
        {label}
      </label>
      <Input id={id} defaultValue={defaultValue} />
      <p className="text-[11px] text-slate-600">{hint}</p>
    </div>
  );
}

function PolicyToggle({
  icon,
  title,
  description,
  enabled,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/3 p-3.5">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200">{title}</p>
        <p className="text-xs leading-relaxed text-slate-500 mt-0.5">{description}</p>
      </div>
      <Badge variant={enabled ? "success" : "secondary"} dot={enabled} className="shrink-0 mt-0.5">
        {enabled ? "On" : "Off"}
      </Badge>
    </div>
  );
}
