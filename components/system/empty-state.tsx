import { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div
      className="rounded-2xl"
      style={{
        background: "rgba(34,197,94,0.03)",
        border: "1px dashed var(--border-default)",
      }}
    >
      <div className="flex flex-col items-center gap-5 py-16 px-8 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            background: "rgba(34,197,94,0.10)",
            border: "1px solid var(--border-default)",
            color: "var(--green-400)",
          }}
        >
          {icon ?? <Sparkles className="h-7 w-7" />}
        </div>
        <div className="max-w-sm space-y-2">
          <h3 className="text-lg font-semibold text-primary">{title}</h3>
          <p className="text-sm leading-relaxed text-muted">{description}</p>
        </div>
        {actionLabel && (
          <Button onClick={onAction} variant="secondary" className="mt-1">
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
