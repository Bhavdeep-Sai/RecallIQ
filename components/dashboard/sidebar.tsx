"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { navigationItems } from "@/lib/navigation";
import { useUiStore } from "@/store/ui-store";

export function Sidebar() {
  const pathname = usePathname();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUiStore();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-30 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        style={{ background: "rgba(0,0,0,0.55)" }}
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* Sidebar panel */}
      <aside
        className={cn(
          "sidebar-bg fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col transition-transform duration-300 lg:translate-x-0",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-[0_4px_16px_rgba(34,197,94,0.4)]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wide text-primary">RecallIQ</div>
              <div className="text-[10px] text-muted leading-none mt-0.5">Sales Intelligence</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" dot>Live</Badge>
            <Button
              className="lg:hidden h-7 w-7"
              onClick={() => setMobileSidebarOpen(false)}
              size="icon"
              variant="ghost"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-faint">
            Navigation
          </p>
          {navigationItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 border",
                  active ? "nav-active" : "border-transparent hover:border-[var(--border-subtle)]",
                )}
                style={!active ? { color: "var(--text-muted)" } : { color: "var(--text-primary)" }}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                  )}
                  style={
                    active
                      ? { background: "rgba(34,197,94,0.18)", color: "var(--green-400)" }
                      : { background: "rgba(34,197,94,0.06)", color: "var(--text-muted)" }
                  }
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium leading-none" style={{ color: "var(--text-primary)" }}>
                    {item.label}
                  </div>
                  <div className="mt-0.5 text-[11px] leading-relaxed truncate" style={{ color: "var(--text-faint)" }}>
                    {item.description}
                  </div>
                </div>
                {active && (
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400 shrink-0 status-dot" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer status */}
        <div className="px-4 py-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <div
            className="rounded-xl p-3"
            style={{
              background: "rgba(34,197,94,0.06)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-green-400 status-dot" />
              <span className="text-xs font-medium text-primary">All systems operational</span>
            </div>
            <p className="text-[11px] leading-relaxed text-muted">
              Memory engine, routing, and auth are running normally.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
