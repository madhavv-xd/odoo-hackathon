import { cn } from "@/lib/utils";
import type { StatusMeta } from "@/lib/status";

// Colored dot + mono uppercase label — the shared status treatment used across
// vehicles, drivers (and trips/maintenance in later phases).
export function StatusBadge({ meta }: { meta: StatusMeta }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2 py-0.5">
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      <span className="data text-[11px] font-medium uppercase tracking-wide">
        {meta.label}
      </span>
    </span>
  );
}
