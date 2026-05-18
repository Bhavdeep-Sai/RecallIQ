"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/format";
import type { EscalationRecord } from "@/lib/services/runtime-analytics";

const SEVERITY_CONFIG = {
  low: {
    icon: <Info className="h-3.5 w-3.5" />,
    color: "text-cyan-400",
    bg: "rgba(6,182,212,0.08)",
    border: "rgba(34,211,238,0.18)",
    badge: "secondary" as const,
  },
  medium: {
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    color: "text-amber-400",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(251,191,36,0.18)",
    badge: "warning" as const,
  },
  high: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    color: "text-rose-400",
    bg: "rgba(244,63,94,0.08)",
    border: "rgba(251,113,133,0.18)",
    badge: "destructive" as const,
  },
  critical: {
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
    color: "text-rose-300",
    bg: "rgba(244,63,94,0.12)",
    border: "rgba(251,113,133,0.28)",
    badge: "destructive" as const,
  },
};

const STATUS_CONFIG = {
  open:          { icon: <AlertCircle className="h-3 w-3" />,   label: "open",          variant: "warning" as const },
  investigating: { icon: <AlertTriangle className="h-3 w-3" />, label: "investigating", variant: "warning" as const },
  resolved:      { icon: <CheckCircle2 className="h-3 w-3" />,  label: "resolved",      variant: "success" as const },
  dismissed:     { icon: <XCircle className="h-3 w-3" />,       label: "dismissed",     variant: "secondary" as const },
};

interface EscalationFeedProps {
  escalations: EscalationRecord[];
}

export function EscalationFeed({ escalations }: EscalationFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-400" />
          Escalation events
        </CardTitle>
        <CardDescription>
          Budget breaches, model failures, and quality upgrades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {escalations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 opacity-60" />
            <p className="text-sm text-muted">No escalation events — all systems nominal.</p>
          </div>
        ) : (
          escalations.map((event, i) => {
            const sev = SEVERITY_CONFIG[event.severity] ?? SEVERITY_CONFIG.low;
            const sta = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.open;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex items-start gap-3 rounded-xl p-3"
                style={{ background: sev.bg, border: `1px solid ${sev.border}` }}
              >
                <div className={`shrink-0 mt-0.5 ${sev.color}`}>{sev.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[11px] font-mono text-slate-400">{event.reason}</span>
                    <Badge variant={sta.variant} className="gap-1 text-[10px] px-1.5 py-0">
                      {sta.icon}
                      {sta.label}
                    </Badge>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400 line-clamp-2">{event.summary}</p>
                  <p className="text-[10px] text-slate-600 mt-1">{formatRelativeTime(event.createdAt)}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
