import Link from "next/link";
import { EmptyState } from "@/components/system/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <EmptyState
          actionLabel="Return to overview"
          description="The requested page could not be found. Return to the dashboard to continue managing customers, memory, and runtime intelligence."
          title="Page not found"
        />
        <div className="mt-4 flex justify-center">
          <Button asChild variant="secondary">
            <Link href="/">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}