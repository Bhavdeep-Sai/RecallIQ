import { ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HoverTooltip } from "@/components/ui/hover-tooltip";

interface PageHeaderProps {
  title: string;
  description: string;
  badge?: string;
  actions?: ReactNode;
  className?: string;
  icon?: ReactNode;
  helpTitle?: string;
  helpText?: ReactNode;
}

export function PageHeader({ title, description, badge, actions, className, icon, helpTitle, helpText }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="flex items-start gap-4">
        {icon && (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl mt-0.5"
            style={{
              background: "rgba(34,197,94,0.12)",
              border: "1px solid var(--border-default)",
              color: "var(--green-400)",
            }}
          >
            {icon}
          </div>
        )}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {badge && (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest"
                style={{
                  background: "rgba(34,197,94,0.10)",
                  border: "1px solid var(--border-default)",
                  color: "var(--green-400)",
                }}
              >
                {badge}
              </span>
            )}
            {(helpText || helpTitle) && (
              <HoverTooltip
                align="start"
                trigger={
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full"
                    aria-label={`Help for ${title}`}
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                }
                content={
                  <div className="space-y-2">
                    {helpTitle && <p className="text-xs font-semibold uppercase tracking-widest text-green-300">{helpTitle}</p>}
                    <div className="text-sm leading-relaxed text-slate-100">{helpText ?? description}</div>
                  </div>
                }
              />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">{title}</h1>
          <p className="text-sm leading-relaxed text-muted max-w-xl">{description}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
