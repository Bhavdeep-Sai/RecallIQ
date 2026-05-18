"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export function AnalyticsActions() {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    if (isDownloading) return;
    setIsDownloading(true);
    
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: "Generating report...",
        success: "Analytics report downloaded successfully",
        error: "Failed to generate report",
      }
    ).finally(() => {
      setIsDownloading(false);
    });
  };

  return (
    <>
      <Button variant="secondary" onClick={handleDownload} disabled={isDownloading}>
        {isDownloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
        Download report
      </Button>
    </>
  );
}
