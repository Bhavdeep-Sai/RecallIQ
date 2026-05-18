import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl", className)}
      style={{ background: "rgba(74, 222, 128, 0.08)" }}
    />
  );
}
