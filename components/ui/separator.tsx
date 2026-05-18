import { cn } from "@/lib/utils";

interface SeparatorProps {
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function Separator({ className, orientation = "horizontal" }: SeparatorProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        orientation === "horizontal" ? "h-px w-full" : "w-px self-stretch",
        "border-subtle",
        className,
      )}
      style={{ background: "var(--border-subtle)" }}
    />
  );
}
