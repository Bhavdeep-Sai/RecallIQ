"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { hasClerkPublishableKey } from "@/lib/auth-flags";

export function AppProviders({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  );

  const content = (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        enableSystem={false}
        storageKey="recalliq-theme"
      >
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            className:
              "!rounded-2xl !border !border-white/10 !bg-slate-950 !text-slate-100 !shadow-2xl",
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );

  if (!hasClerkPublishableKey) {
    return content;
  }

  return <ClerkProvider>{content}</ClerkProvider>;
}