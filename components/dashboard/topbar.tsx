"use client";

import {
  Bell, Menu, Search, HelpCircle, LogOut, User, Settings2,
  Sparkles, ShieldAlert, MessageSquareText, Clock, Wallet, AlertTriangle, CheckCircle2, CheckCheck,
} from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { hasClerkPublishableKey } from "@/lib/auth-flags";
import { useUiStore } from "@/store/ui-store";
import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import type { Notification, NotificationKind } from "@/app/api/notifications/route";

const pageHelp: Record<string, { title: string; content: ReactNode }> = {
  "/": {
    title: "Overview",
    content: <p>Executive snapshot of memory, runtime health, and AI spend. Use this page to see whether the product is stable and where the team should focus next.</p>,
  },
  "/customers": {
    title: "Customers",
    content: <p>Customer accounts, deal health, and forecast context live here. Hover the cards to inspect risk, health, and the memory-backed signals tied to each account.</p>,
  },
  "/conversations": {
    title: "Conversations",
    content: <p>Every conversation card represents a call, email, or meeting. The summary shows what happened, tone shows how the customer felt, and next step shows what the rep should do next.</p>,
  },
  "/ai-memory": {
    title: "AI Memory",
    content: <p>This page stores objections, tone, pricing pressure, stakeholder notes, and other durable signals. It is the long-term context layer used by the AI across sessions.</p>,
  },
  "/runtime-intelligence": {
    title: "Runtime Intelligence",
    content: <p>Monitor routing decisions, rule enforcement, latency, and model behavior. This view helps you understand how the AI is behaving in production.</p>,
  },
  "/analytics": {
    title: "Analytics",
    content: <p>Revenue, adoption, memory usage, and operating efficiency are summarized here. The charts and takeaways show what is growing, what is costing money, and what needs attention.</p>,
  },
  "/follow-ups": {
    title: "Follow-ups",
    content: <p>Review memory-aware follow-up drafts and scheduled actions. This is where the product turns conversation context into concrete next steps.</p>,
  },
  "/settings": {
    title: "Settings",
    content: <p>Workspace preferences, integrations, and profile controls are managed here. Use it to adjust the app behavior and account details.</p>,
  },
  "/profile": {
    title: "Profile",
    content: <p>Manage your identity, security settings, and notification preferences. This page reflects the personal account controls for the current user.</p>,
  },
  "/notifications": {
    title: "Notifications",
    content: <p>All workspace notifications in one place — new conversations, pending follow-ups, escalation alerts, high-importance memory captures, and budget warnings. Click any item to navigate directly to it.</p>,
  },
};

function findHelpForPath(pathname: string | null) {
  if (!pathname) return pageHelp["/"];
  const exact = pageHelp[pathname];
  if (exact) return exact;
  const base = pathname.split("/")[1];
  return pageHelp[`/${base}`] ?? pageHelp["/"];
}

function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  const fullName = user?.fullName ?? user?.firstName ?? "User";
  const email    = user?.primaryEmailAddress?.emailAddress ?? "RecallIQ workspace";
  const avatarUrl = user?.imageUrl ?? null;
  const initials  = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Avatar */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden text-white text-sm font-bold shadow-[0_2px_12px_rgba(34,197,94,0.4)] hover:shadow-[0_2px_20px_rgba(34,197,94,0.55)] transition-all focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:ring-offset-2 focus:ring-offset-transparent"
        style={{ background: avatarUrl ? "transparent" : "linear-gradient(135deg,#22c55e,#10b981)" }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={fullName} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          initials
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="dropdown-bg absolute right-0 top-11 z-50 w-60 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={fullName} className="h-8 w-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg,#22c55e,#10b981)" }}>
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{fullName}</p>
              <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>{email}</p>
            </div>
          </div>

          {/* Links */}
          <div className="p-1.5 space-y-0.5">
            <DropdownLink href="/profile"  icon={<User className="h-3.5 w-3.5" />}     label="Profile"  onClick={() => setOpen(false)} />
            <DropdownLink href="/settings" icon={<Settings2 className="h-3.5 w-3.5" />} label="Settings" onClick={() => setOpen(false)} />
          </div>

          {/* Sign out */}
          <div className="p-1.5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            {hasClerkPublishableKey ? (
              <SignOutButton redirectUrl="/sign-in">
                <button
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors"
                  style={{ color: "var(--danger-text)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--danger-bg)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </SignOutButton>
            ) : (
              <button
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm cursor-default"
                style={{ color: "var(--text-secondary)" }}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out (demo mode)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors text-secondary hover:text-primary"
      style={{ color: "var(--text-secondary)" }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(34,197,94,0.08)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ color: "var(--text-muted)" }}>{icon}</span>
      {label}
    </Link>
  );
}

// ─── Notification helpers ────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return `${Math.floor(diffHr / 24)}d`;
}

function notificationIcon(kind: NotificationKind) {
  switch (kind) {
    case "escalation":   return <ShieldAlert className="h-4 w-4" style={{ color: "#f87171" }} />;
    case "budget":       return <Wallet className="h-4 w-4" style={{ color: "#fb923c" }} />;
    case "follow_up":    return <Clock className="h-4 w-4" style={{ color: "#facc15" }} />;
    case "memory":       return <Sparkles className="h-4 w-4" style={{ color: "#22d3ee" }} />;
    case "conversation": return <MessageSquareText className="h-4 w-4" style={{ color: "#4ade80" }} />;
    default:             return <CheckCircle2 className="h-4 w-4" style={{ color: "var(--text-muted)" }} />;
  }
}

function urgencyBorder(kind: NotificationKind): string {
  switch (kind) {
    case "escalation": return "#f87171";
    case "budget":     return "#fb923c";
    case "follow_up":  return "#facc15";
    case "memory":     return "#22d3ee";
    default:           return "var(--surface-overlay-border)";
  }
}

// ─── Topbar ──────────────────────────────────────────────────────────────────

export function Topbar() {
  const toggleMobileSidebar = useUiStore((state) => state.toggleMobileSidebar);
  const pathname = usePathname();
  const help = findHelpForPath(pathname);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const router = useRouter();

  // Read-state via localStorage (synced with notifications page)
  const LS_KEY = "recalliq_read_notifs";
  const getReadIds = (): Set<string> => {
    try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as string[]); } catch { return new Set(); }
  };
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  useEffect(() => { setReadIds(getReadIds()); }, []);

  const markAllRead = () => {
    const all = new Set(notifications.map((n) => n.id));
    setReadIds(all);
    setUnreadCount(0);
    try { localStorage.setItem(LS_KEY, JSON.stringify([...all])); } catch { /* ignore */ }
  };

  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const json = await res.json();
        const items: Notification[] = json.notifications ?? [];
        setNotifications(items);
        const currentRead = getReadIds();
        setReadIds(currentRead);
        const unread = items.filter((n) => !currentRead.has(n.id)).length;
        setUnreadCount(notificationsOpen ? 0 : unread);
      }
    } catch {
      // non-critical — silently fail
    } finally {
      setNotifLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationsOpen]);

  // Fetch on mount + every 60 s
  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Re-fetch when panel opens
  useEffect(() => {
    if (notificationsOpen) fetchNotifications();
  }, [notificationsOpen, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoverOpen(true);
    fetchNotifications();
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => setHoverOpen(false), 180);
  };

  const handleOpen = () => {
    router.push("/notifications");
  };

  return (
    <header className="topbar-bg sticky top-0 z-20">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <Button className="lg:hidden" onClick={toggleMobileSidebar} size="icon" variant="ghost" aria-label="Open menu">
          <Menu className="h-4 w-4" />
        </Button>

        {/* Search */}
        <div className="hidden flex-1 items-center md:flex max-w-md">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" style={{ color: "var(--text-muted)" }} />
            <Input className="pl-9 h-9 text-sm" placeholder="Search customers, memories, conversations…" />
          </div>
        </div>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          <HoverTooltip
            align="end"
            trigger={
              <Button size="icon" variant="ghost" className="h-9 w-9" aria-label="Help">
                <HelpCircle className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              </Button>
            }
            contentClassName="dropdown-bg"
            content={
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--green-400)" }}>{help.title}</p>
                <div className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{help.content}</div>
              </div>
            }
          />

          <div
            className="relative"
            ref={notificationRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 relative"
              aria-label="Notifications"
              onClick={handleOpen}
            >
              <Bell className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              {unreadCount > 0 ? (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: "#f87171" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full" style={{ background: "var(--green-400)" }} />
              )}
            </Button>

            {/* Hover preview panel */}
            {hoverOpen && (
              <div
                className="dropdown-bg absolute right-0 top-11 z-50 rounded-2xl"
                style={{ width: "360px", padding: "14px" }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Notifications</p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAllRead(); }}
                        className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg transition-all"
                        style={{ background: "rgba(34,197,94,0.1)", color: "var(--green-400)", border: "1px solid rgba(34,197,94,0.2)" }}
                      >
                        <CheckCheck className="h-3 w-3" />
                        Mark all read
                      </button>
                    )}
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
                      style={{ background: "var(--success-bg)", color: "var(--success-text)" }}>
                      Live
                    </span>
                  </div>
                </div>

                {/* Items — unread only */}
                <div className="flex flex-col gap-3" style={{ maxHeight: "380px", overflowY: "auto" }}>
                  {notifLoading && notifications.length === 0 ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="rounded-xl border p-4 animate-pulse"
                        style={{ background: "var(--surface-overlay-bg)", borderColor: "var(--surface-overlay-border)" }}>
                        <div className="flex gap-3">
                          <div className="h-4 w-4 rounded-full mt-0.5 shrink-0" style={{ background: "var(--border-default)" }} />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 rounded w-3/4" style={{ background: "var(--border-default)" }} />
                            <div className="h-2.5 rounded w-full" style={{ background: "var(--border-subtle)" }} />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (() => {
                    const unread = notifications.filter((n) => !readIds.has(n.id)).slice(0, 5);
                    if (unread.length === 0) return (
                      <div className="flex flex-col items-center gap-3 py-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full"
                          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                          <CheckCheck className="h-6 w-6" style={{ color: "var(--green-400)" }} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>You&apos;re all caught up!</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>No unread notifications</p>
                        </div>
                      </div>
                    );
                    return unread.map((item) => {
                      const card = (
                        <div
                          className="rounded-xl border p-4 transition-all hover:shadow-sm"
                          style={{
                            background: "rgba(34,197,94,0.04)",
                            borderColor: urgencyBorder(item.kind),
                            borderLeftWidth: "3px",
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0">{notificationIcon(item.kind)}</div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                                <span className="text-[10px] uppercase tracking-widest shrink-0" style={{ color: "var(--text-faint)" }}>
                                  {relativeTime(item.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>{item.text}</p>
                            </div>
                          </div>
                        </div>
                      );
                      return item.href ? (
                        <Link key={item.id} href={item.href} onClick={() => setHoverOpen(false)}>
                          {card}
                        </Link>
                      ) : (
                        <div key={item.id}>{card}</div>
                      );
                    });
                  })()}
                </div>


                {/* Footer */}
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <Link
                    href="/notifications"
                    onClick={() => setHoverOpen(false)}
                    className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2 text-xs font-semibold transition-all"
                    style={{ background: "rgba(34,197,94,0.08)", color: "var(--green-400)", border: "1px solid rgba(34,197,94,0.15)" }}
                  >
                    <Bell className="h-3.5 w-3.5" />
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          <ThemeToggle />

          <div className="h-5 w-px" style={{ background: "var(--border-default)" }} />

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
