"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HoverTooltipProps {
  trigger: ReactNode;
  content: ReactNode;
  className?: string;
  contentClassName?: string;
  align?: "start" | "center" | "end";
}

export function HoverTooltip({ trigger, content, className, contentClassName, align = "center" }: HoverTooltipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const alignmentClasses =
    align === "start"
      ? "left-0"
      : align === "end"
      ? "right-0"
      : "left-1/2 -translate-x-1/2";

  return (
    <div
      ref={rootRef}
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      {trigger}
      {open && (
        <div
          role="tooltip"
          className={cn(
            "absolute top-full z-50 mt-2 w-80 rounded-2xl border px-4 py-3 text-sm shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-md",
            alignmentClasses,
            contentClassName,
          )}
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border-default)", color: "var(--text-primary)", boxShadow: "var(--shadow-card)" }}
        >
          {content}
        </div>
      )}
    </div>
  );
}