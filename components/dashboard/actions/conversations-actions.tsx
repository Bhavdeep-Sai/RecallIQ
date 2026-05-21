"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export function ConversationsActions() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      const response = await fetch("/api/conversations/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to sync transcripts");
      }

      if (data.syncedCount > 0) {
        toast.success(data.message ?? `Synced ${data.syncedCount} conversation(s)`);
      } else {
        toast(data.message ?? "No new conversations to sync");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sync transcripts");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button onClick={handleSync} disabled={isSyncing}>
      {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
      Sync transcripts
    </Button>
  );
}
