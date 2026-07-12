import { Activity } from "lucide-react";
import { getRecentActivity, timeAgo, type ActivityKind } from "@/lib/activity";

const KIND_COLOR: Record<ActivityKind, string> = {
  dispatched: "bg-status-on-trip",
  completed: "bg-status-available",
  maint_open: "bg-status-warning",
  maint_close: "bg-status-available",
  drafted: "bg-muted-foreground",
};

export async function ActivityTimeline() {
  const events = await getRecentActivity();

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-medium">
        <Activity className="size-4 text-primary" />
        Activity
      </h2>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No activity yet. Dispatch a trip or open a maintenance log to see it
          here.
        </p>
      ) : (
        <ol className="relative space-y-4 before:absolute before:left-[3px] before:top-1 before:bottom-1 before:w-px before:bg-border">
          {events.map((e) => (
            <li key={e.id} className="relative flex items-start gap-3 pl-5">
              <span
                className={`absolute left-0 top-1 size-[7px] rounded-full ring-4 ring-card ${KIND_COLOR[e.kind]}`}
              />
              <div className="min-w-0 flex-1">
                <p className="data text-sm font-medium">{e.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {e.detail}
                </p>
              </div>
              <span className="data shrink-0 text-[11px] text-muted-foreground tabular-nums">
                {timeAgo(e.at)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
