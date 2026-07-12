import "server-only";
import { db } from "@/lib/db";

// A unified, chronological stream of real fleet events, derived entirely from
// existing timestamps (no schema change). This is the live version of the
// status-transition feed shown on the login screen.

export type ActivityKind =
  | "drafted"
  | "dispatched"
  | "completed"
  | "maint_open"
  | "maint_close";

export type ActivityEvent = {
  id: string;
  at: Date;
  kind: ActivityKind;
  reg: string;
  title: string;
  detail: string;
};

export async function getRecentActivity(limit = 12): Promise<ActivityEvent[]> {
  const [trips, maintenance] = await Promise.all([
    db.trip.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        vehicle: { select: { regNumber: true } },
        driver: { select: { name: true } },
      },
    }),
    db.maintenanceLog.findMany({
      orderBy: { openedAt: "desc" },
      take: 20,
      include: { vehicle: { select: { regNumber: true } } },
    }),
  ]);

  const events: ActivityEvent[] = [];

  for (const t of trips) {
    const reg = t.vehicle.regNumber;
    const route = `${t.source} → ${t.destination}`;
    events.push({
      id: `${t.id}-draft`,
      at: t.createdAt,
      kind: "drafted",
      reg,
      title: `${reg} · trip drafted`,
      detail: route,
    });
    if (t.dispatchedAt) {
      events.push({
        id: `${t.id}-dispatch`,
        at: t.dispatchedAt,
        kind: "dispatched",
        reg,
        title: `${reg} → On Trip`,
        detail: `${route} · ${t.driver.name}`,
      });
    }
    if (t.completedAt) {
      events.push({
        id: `${t.id}-complete`,
        at: t.completedAt,
        kind: "completed",
        reg,
        title: `${reg} → Available`,
        detail: `trip completed · ${t.plannedDistanceKm} km`,
      });
    }
  }

  for (const m of maintenance) {
    const reg = m.vehicle.regNumber;
    events.push({
      id: `${m.id}-open`,
      at: m.openedAt,
      kind: "maint_open",
      reg,
      title: `${reg} → In Shop`,
      detail: m.description,
    });
    if (m.closedAt) {
      events.push({
        id: `${m.id}-close`,
        at: m.closedAt,
        kind: "maint_close",
        reg,
        title: `${reg} → Available`,
        detail: "maintenance closed",
      });
    }
  }

  return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

export function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
