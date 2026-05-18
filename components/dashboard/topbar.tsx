"use client";

import { Bell, Menu, Search, HelpCircle, LogOut, User, Settings2 } from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { hasClerkPublishableKey } from "@/lib/auth-flags";
import { useUiStore } from "@/store/ui-store";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

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

export function Topbar() {
  const toggleMobileSidebar = useUiStore((state) => state.toggleMobileSidebar);

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
          <Button size="icon" variant="ghost" className="h-9 w-9" aria-label="Help">
            <HelpCircle className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
          </Button>

          <Button size="icon" variant="ghost" className="h-9 w-9 relative" aria-label="Notifications">
            <Bell className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-green-400" />
          </Button>

          <ThemeToggle />

          <div className="h-5 w-px" style={{ background: "var(--border-default)" }} />

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
