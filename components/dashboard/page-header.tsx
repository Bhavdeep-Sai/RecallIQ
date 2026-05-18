import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description: string;
  badge?: string;
  actions?: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function PageHeader({ title, description, badge, actions, className, icon }: PageHeaderProps) {
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
          <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">{title}</h1>
          <p className="text-sm leading-relaxed text-muted max-w-xl">{description}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
