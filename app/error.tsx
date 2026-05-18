"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/system/error-state";

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-2xl">
          <ErrorState description={error.message} onRetry={reset} />
        </div>
      </body>
    </html>
  );
}