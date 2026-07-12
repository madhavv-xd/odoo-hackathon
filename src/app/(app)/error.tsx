"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </div>
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This screen hit an error and couldn&rsquo;t load. Your data is safe —
          try again.
        </p>
        {error.digest && (
          <p className="data mt-3 text-[11px] text-muted-foreground">
            ref {error.digest}
          </p>
        )}
        <Button onClick={reset} className="mt-5">
          Try again
        </Button>
      </div>
    </div>
  );
}
