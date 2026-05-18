"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export function ConversationsActions() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 3000)),
      {
        loading: "Syncing transcripts from CRM...",
        success: "3 new conversations synced",
        error: "Failed to sync transcripts",
      }
    ).finally(() => {
      setIsSyncing(false);
    });
  };

  return (
    <>
      <Button onClick={handleSync} disabled={isSyncing}>
        {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
        Sync transcripts
      </Button>
    </>
  );
}
