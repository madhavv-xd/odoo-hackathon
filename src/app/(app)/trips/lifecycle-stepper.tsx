import { cn } from "@/lib/utils";
import type { TripStatus } from "@/generated/prisma/enums";

// Static trip lifecycle indicator (wireframe #4). Shows the four stages with a
// live count each; the "flowing" stages (draft → dispatched → completed) are
// connected, with cancelled shown as a terminal off-ramp.
const STAGES: { status: TripStatus; label: string; dotClass: string }[] = [
  { status: "draft", label: "Draft", dotClass: "bg-muted-foreground" },
  { status: "dispatched", label: "Dispatched", dotClass: "bg-status-on-trip" },
  { status: "completed", label: "Completed", dotClass: "bg-status-available" },
  { status: "cancelled", label: "Cancelled", dotClass: "bg-status-error" },
];

export function LifecycleStepper({
  counts,
}: {
  counts: Record<TripStatus, number>;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-border bg-card px-4 py-3">
      <span className="mr-3 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Trip lifecycle
      </span>
      {STAGES.map((stage, i) => {
        const active = counts[stage.status] > 0;
        return (
          <div key={stage.status} className="flex shrink-0 items-center">
            <div
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1",
                active ? "opacity-100" : "opacity-40",
              )}
            >
              <span className={cn("size-2.5 rounded-full", stage.dotClass)} />
              <span className="text-sm">{stage.label}</span>
              <span className="data text-sm text-muted-foreground">
                {counts[stage.status]}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <span className="mx-1 h-px w-6 shrink-0 bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}
