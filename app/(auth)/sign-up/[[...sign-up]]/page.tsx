"use client";

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hasClerkPublishableKey } from "@/lib/auth-flags";

export default function SignUpPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = !mounted || resolvedTheme === "dark";

  const appearance = {
    variables: isDark
      ? {
          colorBackground: "#111827",
          colorText: "#f9fafb",
          colorTextSecondary: "#9ca3af",
          colorInputBackground: "#1f2937",
          colorInputText: "#f9fafb",
          colorPrimary: "#22c55e",
          colorTextOnPrimaryBackground: "#ffffff",
          colorNeutral: "#6b7280",
          colorDanger: "#f87171",
          borderRadius: "0.5rem",
        }
      : {
          colorPrimary: "#16a34a",
          borderRadius: "0.5rem",
        },
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--bg-base)" }}>
      {hasClerkPublishableKey ? (
        <SignUp
          appearance={appearance}
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
        />
      ) : (
        <div
          className="w-full max-w-sm rounded-2xl p-8 space-y-5"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Create your account</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Clerk is not configured — demo mode</p>
          </div>
          <Badge variant="outline" className="w-full justify-center">Demo mode</Badge>
          <Button asChild className="w-full"><Link href="/">Continue to dashboard →</Link></Button>
        </div>
      )}
    </div>
  );
}
