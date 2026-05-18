"use client";

import { Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export function SettingsLinks() {
  const handleManageMembers = () => {
    toast("Member management is available in the Clerk dashboard.", {
      icon: "👥",
    });
  };

  const handleClerkConsole = () => {
    toast.success("Opening Clerk authentication console...");
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button variant="secondary" className="w-full" onClick={handleManageMembers}>
        <Users className="h-4 w-4 mr-2" />
        Manage members
      </Button>
      <Button variant="outline" className="w-full" onClick={handleClerkConsole}>
        <ExternalLink className="h-4 w-4 mr-2" />
        Clerk console
      </Button>
    </div>
  );
}
