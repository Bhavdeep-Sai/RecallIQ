"use client";

import {
  User,
  Mail,
  Building2,
  Shield,
  Bell,
  Key,
  LogOut,
  Edit3,
  Clock,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { hasClerkPublishableKey } from "@/lib/auth-flags";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { openUserProfile, signOut } = useClerk();

  // Derive display values from Clerk user or fall back to placeholders
  const firstName   = user?.firstName ?? "";
  const lastName    = user?.lastName  ?? "";
  const fullName    = user?.fullName  ?? (firstName || lastName ? `${firstName} ${lastName}`.trim() : "User");
  const email       = user?.primaryEmailAddress?.emailAddress ?? "";
  const avatarUrl   = user?.imageUrl ?? null;
  const initials    = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<User className="h-5 w-5" />}
        badge="Account"
        title="Profile"
        description="Manage your personal details, notification preferences, and account security."
        actions={
          <>
            {hasClerkPublishableKey ? (
              <Button variant="secondary" onClick={() => signOut({ redirectUrl: "/sign-in" })}>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            ) : (
              <Button variant="secondary" disabled>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            )}
            <Button onClick={() => openUserProfile()}>
              <Edit3 className="h-4 w-4" />
              Edit profile
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">

        {/* Left — identity */}
        <div className="space-y-6">

          {/* Avatar + name */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={fullName}
                      className="h-20 w-20 rounded-2xl object-cover shadow-[0_4px_24px_rgba(34,197,94,0.3)]"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-green-500 to-emerald-600 text-white text-2xl font-bold shadow-[0_4px_24px_rgba(34,197,94,0.4)]">
                      {isLoaded ? initials : "…"}
                    </div>
                  )}
                  <button
                    aria-label="Change avatar"
                    onClick={() => openUserProfile()}
                    className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors"
                    style={{
                      background: "var(--bg-elevated)",
                      borderColor: "var(--border-default)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
                    {isLoaded ? fullName : "Loading…"}
                  </h2>
                  <p className="text-sm mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
                    {email || "No email on file"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="success" dot>Active</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal info — read-only, edit via Clerk modal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4 text-cyan-400" />
                Personal information
              </CardTitle>
              <CardDescription>Your name and contact details from your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <ProfileField label="First name" value={firstName} icon={<User className="h-3.5 w-3.5" />} />
                <ProfileField label="Last name"  value={lastName}  icon={<User className="h-3.5 w-3.5" />} />
              </div>
              <ProfileField label="Email address" value={email} icon={<Mail className="h-3.5 w-3.5" />} type="email" />
              <ProfileField
                label="Organization"
                value={user?.organizationMemberships?.[0]?.organization?.name ?? "—"}
                icon={<Building2 className="h-3.5 w-3.5" />}
              />
              <div className="pt-1">
                <Button className="w-full" onClick={() => openUserProfile()}>
                  <Edit3 className="h-4 w-4" />
                  Edit in Clerk
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-violet-400" />
                Security
              </CardTitle>
              <CardDescription>Password and authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SecurityRow
                icon={<Key className="h-4 w-4 text-amber-400" />}
                title="Password"
                description="Manage via your Clerk account"
                action="Change"
                onAction={() => openUserProfile()}
              />
              <SecurityRow
                icon={<Shield className="h-4 w-4 text-emerald-400" />}
                title="Two-factor authentication"
                description="Add an extra layer of security"
                action="Manage"
                badge={<Badge variant="warning">Recommended</Badge>}
                onAction={() => openUserProfile()}
              />
              <SecurityRow
                icon={<Activity className="h-4 w-4 text-cyan-400" />}
                title="Active sessions"
                description="Manage active sessions"
                action="View"
                onAction={() => openUserProfile()}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right — activity + notifications */}
        <div className="space-y-6">

          {/* Account info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                Account details
              </CardTitle>
              <CardDescription>Your Clerk account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ActivityStat
                icon={<Mail className="h-4 w-4 text-cyan-400" />}
                label="Primary email"
                value={email || "—"}
                sub="Verified email address"
                small
              />
              <ActivityStat
                icon={<User className="h-4 w-4 text-violet-400" />}
                label="User ID"
                value={user?.id ? `${user.id.slice(0, 12)}…` : "—"}
                sub="Clerk user identifier"
                small
              />
              <ActivityStat
                icon={<Clock className="h-4 w-4 text-amber-400" />}
                label="Last active"
                value="Just now"
                sub="Most recent session"
              />
              <ActivityStat
                icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                label="Account status"
                value="Active"
                sub="No issues detected"
              />
            </CardContent>
          </Card>

          {/* Notification preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-400" />
                Notification preferences
              </CardTitle>
              <CardDescription>Choose what you want to be notified about</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <NotificationRow title="Memory alerts"     description="When new customer insights are captured"          enabled />
              <NotificationRow title="Budget warnings"   description="When AI spend approaches the monthly cap"         enabled />
              <NotificationRow title="Deal risk signals" description="When a customer's health score drops significantly" enabled />
              <NotificationRow title="System updates"    description="Platform maintenance and feature announcements"    enabled={false} />
              <NotificationRow title="Weekly digest"     description="Summary of activity and key metrics every Monday"  enabled />
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-400">
                <Shield className="h-4 w-4" />
                Danger zone
              </CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl p-4 flex items-center justify-between gap-4" style={{ border: "1px solid var(--danger-border)", background: "var(--danger-bg)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--danger-text)" }}>Delete account</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    Permanently remove your account and all associated data.
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => openUserProfile()}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value, icon, type = "text" }: { label: string; value: string; icon?: React.ReactNode; type?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
        {icon && <span style={{ color: "var(--text-secondary)" }}>{icon}</span>}
        {label}
      </label>
      <Input value={value} type={type} readOnly onChange={() => {}} />
    </div>
  );
}

function SecurityRow({ icon, title, description, action, badge, onAction }: {
  icon: React.ReactNode; title: string; description: string; action: string; badge?: React.ReactNode; onAction?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-3.5" style={{ border: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}>
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{title}</p>
          {badge}
        </div>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{description}</p>
      </div>
      <Button variant="secondary" size="sm" className="shrink-0 text-xs" onClick={onAction}>{action}</Button>
    </div>
  );
}

function ActivityStat({ icon, label, value, sub, small }: { icon: React.ReactNode; label: string; value: string; sub: string; small?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-3.5" style={{ border: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}>
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: "var(--text-secondary)" }}>{label}</p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{sub}</p>
      </div>
      <p className={`font-bold shrink-0 truncate max-w-[140px] text-right ${small ? "text-sm" : "text-lg"}`} style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

function NotificationRow({ title, description, enabled }: { title: string; description: string; enabled: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-xl p-3.5" style={{ border: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{title}</p>
        <p className="text-xs leading-relaxed mt-0.5" style={{ color: "var(--text-secondary)" }}>{description}</p>
      </div>
      <Badge variant={enabled ? "success" : "secondary"} dot={enabled} className="shrink-0 mt-0.5">
        {enabled ? "On" : "Off"}
      </Badge>
    </div>
  );
}
