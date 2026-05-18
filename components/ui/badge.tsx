import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "purple";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:     "badge-default",
  secondary:   "badge-secondary",
  outline:     "badge-outline",
  success:     "badge-success",
  warning:     "badge-warning",
  destructive: "badge-danger",
  purple:      "bg-violet-500/15 text-violet-300 border-violet-400/25",
};

const dotColors: Record<BadgeVariant, string> = {
  default:     "bg-green-400",
  secondary:   "bg-gray-400",
  outline:     "bg-gray-500",
  success:     "bg-emerald-400",
  warning:     "bg-amber-400",
  destructive: "bg-rose-400",
  purple:      "bg-violet-400",
};

export function Badge({ className, variant = "default", dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full status-dot shrink-0", dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
