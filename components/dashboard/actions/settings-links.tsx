"use client";

import { Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const clerkDashboardUrl = "https://dashboard.clerk.com";

export function SettingsLinks() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button variant="secondary" className="w-full" asChild>
        <a href={clerkDashboardUrl} target="_blank" rel="noreferrer">
          <Users className="h-4 w-4 mr-2" />
          Manage members
        </a>
      </Button>
      <Button variant="outline" className="w-full" asChild>
        <a href={clerkDashboardUrl} target="_blank" rel="noreferrer">
          <ExternalLink className="h-4 w-4 mr-2" />
          Clerk console
        </a>
      </Button>
    </div>
  );
}
