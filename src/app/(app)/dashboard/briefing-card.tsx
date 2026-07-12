"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateBriefing, type BriefingItem } from "./briefing-actions";

const SEVERITY_STYLES: Record<
  BriefingItem["severity"],
  { dot: string; label: string }
> = {
  critical: { dot: "bg-status-error", label: "text-status-error" },
  warning: { dot: "bg-status-warning", label: "text-status-warning" },
  info: { dot: "bg-status-on-trip", label: "text-status-on-trip" },
};

export function BriefingCard() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<BriefingItem[] | null>(null);

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await generateBriefing();
      if (result.error) toast.error(result.error);
      else setItems(result.items ?? []);
    } catch {
      toast.error("Failed to generate briefing");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          AI Ops Briefing
        </h2>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {loading ? "Generating…" : items ? "Refresh" : "Generate briefing"}
        </Button>
      </div>

      {loading && !items ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-secondary rounded w-3/4" />
          <div className="h-4 bg-secondary rounded w-5/6" />
          <div className="h-4 bg-secondary rounded w-2/3" />
        </div>
      ) : items && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, i) => {
            const s = SEVERITY_STYLES[item.severity] ?? SEVERITY_STYLES.info;
            return (
              <li
                key={i}
                className="flex items-start gap-2.5 rounded-md border border-border px-3 py-2"
              >
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${s.dot}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {item.title}
                    <span
                      className={`ml-2 text-[10px] font-semibold uppercase tracking-wide ${s.label}`}
                    >
                      {item.severity}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </div>
              </li>
            );
          })}
          <p className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
            <Sparkles className="size-3" />
            AI-generated from the live fleet snapshot.
          </p>
        </ul>
      ) : items ? (
        <p className="text-sm text-muted-foreground">
          Nothing urgent — the fleet looks healthy right now.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Generate a prioritized, AI-written briefing of what needs attention
          across the fleet right now.
        </p>
      )}
    </div>
  );
}
