import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", description, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-border)" }}>
      <div className="flex items-start gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-border)", color: "var(--danger-text)" }}
        >
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-primary">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="secondary" size="sm" className="mt-3">
              <RotateCcw className="h-3.5 w-3.5" />
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
