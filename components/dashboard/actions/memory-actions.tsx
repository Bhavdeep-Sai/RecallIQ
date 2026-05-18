"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export function MemoryActions() {
  const [isRebuilding, setIsRebuilding] = useState(false);

  const handleRebuild = async () => {
    if (isRebuilding) return;
    setIsRebuilding(true);
    
    try {
      const response = await fetch("/api/memory/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) throw new Error("Failed to rebuild");
      
      const result = await response.json();
      
      if (result.status === "skipped") {
        toast.success("Index is up to date (no reflection needed)", { duration: 4000 });
      } else {
        toast.success(`Memory index rebuilt successfully (${result.consolidatedCount} consolidated)`, { duration: 4000 });
      }
    } catch (error) {
      toast.error("Failed to rebuild index");
    } finally {
      setIsRebuilding(false);
    }
  };

  return (
    <>
      <Button onClick={handleRebuild} disabled={isRebuilding}>
        {isRebuilding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
        Rebuild semantic index
      </Button>
    </>
  );
}
