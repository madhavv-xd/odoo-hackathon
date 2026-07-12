"use client";

import { useState } from "react";
import { Sparkles, Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { analyzeVehicleHealth, type VehicleHealth } from "./health-actions";

const STATUS_META: Record<
  VehicleHealth["status"],
  { label: string; dot: string; text: string }
> = {
  ok: { label: "Healthy", dot: "bg-status-available", text: "text-status-available" },
  watch: { label: "Watch", dot: "bg-status-warning", text: "text-status-warning" },
  due: { label: "Service due", dot: "bg-status-error", text: "text-status-error" },
};

export function VehicleHealthCard({ vehicleId }: { vehicleId: string }) {
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<VehicleHealth | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    try {
      const result = await analyzeVehicleHealth(vehicleId);
      if (result.error) toast.error(result.error);
      else setHealth(result.health);
    } catch {
      toast.error("Failed to analyze vehicle");
    } finally {
      setLoading(false);
    }
  }

  const meta = health ? STATUS_META[health.status] : null;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <Stethoscope className="size-4 text-primary" />
          AI Health Check
          {meta && (
            <span className={`flex items-center gap-1.5 text-xs ${meta.text}`}>
              <span className={`size-2 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
          )}
        </h2>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {loading ? "Analyzing…" : health ? "Re-analyze" : "Analyze"}
        </Button>
      </div>

      {health ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium">{health.headline}</p>
          <ul className="space-y-1.5">
            {health.points.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary/60" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <p className="flex items-center gap-1 pt-1 text-[10px] text-muted-foreground">
            <Sparkles className="size-3" />
            AI estimate from service, fuel and trip history — verify before acting.
          </p>
        </div>
      ) : !loading ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Run an AI check on this vehicle&rsquo;s service, fuel and trip history
          for a predictive-maintenance read.
        </p>
      ) : (
        <div className="mt-3 space-y-2 animate-pulse">
          <div className="h-4 w-3/4 rounded bg-secondary" />
          <div className="h-4 w-5/6 rounded bg-secondary" />
        </div>
      )}
    </div>
  );
}
