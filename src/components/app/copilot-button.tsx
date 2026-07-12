"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Topbar affordance that opens the Fleet Copilot (also reachable via ⌘K). */
export function CopilotButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => window.dispatchEvent(new Event("transitops:toggle-copilot"))}
    >
      <Sparkles className="size-4 text-primary" />
      Ask Copilot
      <kbd className="hidden rounded border border-border bg-secondary px-1 text-[10px] text-muted-foreground sm:inline">
        ⌘K
      </kbd>
    </Button>
  );
}
