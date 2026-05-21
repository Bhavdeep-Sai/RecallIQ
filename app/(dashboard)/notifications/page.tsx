"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bell, ShieldAlert, Wallet, Clock, Sparkles, MessageSquareText,
  CheckCircle2, AlertTriangle, CheckCheck, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import type { Notification, NotificationKind } from "@/app/api/notifications/route";

// ─── Local read-state helpers ─────────────────────────────────────────────────

const LS_KEY = "recalliq_read_notifs";

function getReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...ids]));
  } catch { /* ignore */ }
}

// ─── Icon + colour helpers ────────────────────────────────────────────────────

function notifIcon(kind: NotificationKind) {
  const cls = "h-5 w-5 shrink-0";
  switch (kind) {
    case "escalation":   return <ShieldAlert className={cls} style={{ color: "#f87171" }} />;
    case "budget":       return <Wallet className={cls} style={{ color: "#fb923c" }} />;
    case "follow_up":    return <Clock className={cls} style={{ color: "#facc15" }} />;
    case "memory":       return <Sparkles className={cls} style={{ color: "#22d3ee" }} />;
    case "conversation": return <MessageSquareText className={cls} style={{ color: "#4ade80" }} />;
    default:             return <CheckCircle2 className={cls} style={{ color: "var(--text-muted)" }} />;
  }
}

function kindBorderColor(kind: NotificationKind): string {
  switch (kind) {
    case "escalation": return "#f87171";
    case "budget":     return "#fb923c";
    case "follow_up":  return "#facc15";
    case "memory":     return "#22d3ee";
    default:           return "transparent";
  }
}

function kindLabel(kind: NotificationKind): string {
  switch (kind) {
    case "escalation":   return "Escalation";
    case "budget":       return "Budget";
    case "follow_up":    return "Follow-up";
    case "memory":       return "Memory";
    case "conversation": return "Conversation";
    default:             return "System";
  }
}

function kindBadgeBg(kind: NotificationKind): string {
  switch (kind) {
    case "escalation":   return "rgba(248,113,113,0.15)";
    case "budget":       return "rgba(251,146,60,0.15)";
    case "follow_up":    return "rgba(250,204,21,0.15)";
    case "memory":       return "rgba(34,211,238,0.15)";
    case "conversation": return "rgba(74,222,128,0.15)";
    default:             return "rgba(255,255,255,0.06)";
  }
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "all" | "unread" | NotificationKind;

const TABS: { key: Tab; label: string }[] = [
  { key: "all",          label: "All" },
  { key: "unread",       label: "Unread" },
  { key: "escalation",   label: "Escalations" },
  { key: "budget",       label: "Budget" },
  { key: "follow_up",    label: "Follow-ups" },
  { key: "memory",       label: "Memory" },
  { key: "conversation", label: "Conversations" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [refreshing, setRefreshing] = useState(false);

  // Load read state from localStorage
  useEffect(() => {
    setReadIds(getReadIds());
  }, []);

  const fetchNotifications = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.notifications ?? []);
      }
    } catch { /* silently fail */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = () => {
    const all = new Set(notifications.map((n) => n.id));
    setReadIds(all);
    saveReadIds(all);
  };

  const markRead = (id: string) => {
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    saveReadIds(next);
  };

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const filtered = notifications.filter((n) => {
    if (activeTab === "all")    return true;
    if (activeTab === "unread") return !readIds.has(n.id);
    return n.kind === activeTab;
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <Bell className="h-5 w-5" style={{ color: "var(--green-400)" }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Notifications</h1>
          </div>
          <p className="text-sm pl-[52px]" style={{ color: "var(--text-secondary)" }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up — no unread notifications"}
          </p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => fetchNotifications(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all"
            style={{ background: "var(--surface-overlay-bg)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all"
              style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "var(--green-400)" }}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap" style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1px" }}>
        {TABS.map((tab) => {
          const count = tab.key === "unread"
            ? unreadCount
            : tab.key === "all"
            ? notifications.length
            : notifications.filter((n) => n.kind === tab.key).length;

          if (count === 0 && tab.key !== "all" && tab.key !== "unread") return null;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-all relative"
              style={{
                color: activeTab === tab.key ? "var(--green-400)" : "var(--text-secondary)",
                borderBottom: activeTab === tab.key ? "2px solid var(--green-400)" : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {tab.label}
              {count > 0 && (
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={{
                    background: activeTab === tab.key ? "rgba(34,197,94,0.2)" : "var(--surface-overlay-bg)",
                    color: activeTab === tab.key ? "var(--green-400)" : "var(--text-muted)",
                  }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border p-5 animate-pulse"
              style={{ background: "var(--surface-overlay-bg)", borderColor: "var(--border-subtle)" }}>
              <div className="flex gap-4">
                <div className="h-5 w-5 rounded-full mt-0.5 shrink-0" style={{ background: "var(--border-default)" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded w-2/3" style={{ background: "var(--border-default)" }} />
                  <div className="h-3 rounded w-full" style={{ background: "var(--border-subtle)" }} />
                  <div className="h-3 rounded w-3/4" style={{ background: "var(--border-subtle)" }} />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 rounded-2xl"
            style={{ background: "var(--surface-overlay-bg)", border: "1px solid var(--border-subtle)" }}>
            <AlertTriangle className="h-10 w-10" style={{ color: "var(--text-faint)" }} />
            <p className="text-base font-medium" style={{ color: "var(--text-secondary)" }}>
              {activeTab === "unread" ? "No unread notifications" : "No notifications here"}
            </p>
            <p className="text-sm text-center max-w-xs" style={{ color: "var(--text-faint)" }}>
              {activeTab === "unread"
                ? "You're all caught up! Switch to 'All' to see past notifications."
                : "Notifications will appear here as your workspace gets activity."}
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isRead = readIds.has(item.id);
            const card = (
              <div
                key={item.id}
                onClick={() => markRead(item.id)}
                className="group rounded-2xl border p-5 transition-all cursor-pointer hover:shadow-sm"
                style={{
                  background: isRead ? "var(--surface-overlay-bg)" : "rgba(34,197,94,0.04)",
                  borderColor: isRead ? "var(--border-subtle)" : kindBorderColor(item.kind),
                  borderLeftWidth: isRead ? "1px" : "3px",
                  opacity: isRead ? 0.75 : 1,
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="mt-0.5">{notifIcon(item.kind)}</div>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
                          {item.title}
                        </p>
                        {!isRead && (
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: "var(--green-400)" }} />
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: kindBadgeBg(item.kind), color: kindBorderColor(item.kind) || "var(--text-muted)" }}>
                          {kindLabel(item.kind)}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                          {relativeTime(item.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {item.text}
                    </p>
                    {item.href && (
                      <p className="mt-2 text-xs font-medium" style={{ color: "var(--green-400)" }}>
                        Click to view →
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );

            return item.href ? (
              <Link key={item.id} href={item.href} onClick={() => markRead(item.id)}>
                {card}
              </Link>
            ) : (
              <div key={item.id}>{card}</div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {!loading && notifications.length > 0 && (
        <p className="text-center text-xs pb-4" style={{ color: "var(--text-faint)" }}>
          Showing {filtered.length} of {notifications.length} notifications · updates from the last 7 days
        </p>
      )}
    </div>
  );
}
