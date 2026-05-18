"use client";

import { useState } from "react";
import { Sparkles, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export function FollowUpsActions() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = () => {
    toast.success("Queue exported to CSV");
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    
    try {
      const response = await fetch("/api/follow-ups/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) throw new Error("Failed to generate");
      
      toast.success("Generated new follow-up draft", { duration: 4000 });
      // Reload the page to show the new draft in the list
      window.location.reload();
    } catch (error) {
      toast.error("Failed to generate follow-up");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button variant="secondary" onClick={handleExport}>
        Export queue
      </Button>
      <Button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Generate follow-up
        {!isGenerating && <Sparkles className="h-4 w-4 ml-2" />}
      </Button>
    </>
  );
}
