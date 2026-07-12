import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { availableVehicles, availableDrivers } from "@/lib/dispatch-pool";
import { TRIP_STATUS_META } from "@/lib/status";
import type { TripStatus } from "@/generated/prisma/enums";
import { StatusBadge } from "@/components/app/status-badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { TripForm } from "./trip-form";
import { TripRowActions } from "./trip-actions";
import { LifecycleStepper } from "./lifecycle-stepper";

const km = new Intl.NumberFormat("en-IN");

// Board ordering: live work first, then history.
const STATUS_ORDER: Record<TripStatus, number> = {
  dispatched: 0,
  draft: 1,
  completed: 2,
  cancelled: 3,
};

function metaLabel(t: {
  status: TripStatus;
  plannedDistanceKm: number;
  driver: { name: string } | null;
}): string {
  switch (t.status) {
    case "dispatched":
      return "In transit";
    case "draft":
      return t.driver ? "Awaiting dispatch" : "Awaiting driver";
    case "completed":
      return `${km.format(t.plannedDistanceKm)} km · done`;
    case "cancelled":
      return "Cancelled";
  }
}

export default async function TripsPage() {
  const session = await getSession();
  const canAct =
    session?.role === "dispatcher" || session?.role === "fleet_manager";

  const [vehicles, drivers, trips] = await Promise.all([
    availableVehicles(),
    availableDrivers(),
    db.trip.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vehicle: { select: { regNumber: true, name: true } },
        driver: { select: { name: true } },
      },
    }),
  ]);

  const counts = trips.reduce(
    (acc, t) => {
      acc[t.status] += 1;
      return acc;
    },
    { draft: 0, dispatched: 0, completed: 0, cancelled: 0 } as Record<
      TripStatus,
      number
    >,
  );

  const board = [...trips].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Trip Dispatcher</h1>
        <p className="text-sm text-muted-foreground">
          Live board — {trips.length} trip{trips.length === 1 ? "" : "s"}
        </p>
      </div>

      <LifecycleStepper counts={counts} />

      <div
        className={
          canAct
            ? "grid gap-6 lg:grid-cols-[minmax(320px,380px)_1fr]"
            : "grid grid-cols-1 gap-6"
        }
      >
        {canAct && (
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Create trip</CardTitle>
              <CardDescription>
                Only available vehicles and eligible drivers are listed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TripForm
                vehicles={vehicles.map((v) => ({
                  id: v.id,
                  regNumber: v.regNumber,
                  name: v.name,
                  maxLoadKg: v.maxLoadKg,
                }))}
                drivers={drivers.map((d) => ({ id: d.id, name: d.name }))}
              />
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Live board
            </span>
          </div>

          {board.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              No trips yet — create one.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {board.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="data text-xs text-muted-foreground">
                        TR{t.id.slice(-4).toUpperCase()}
                      </span>
                      <span className="data text-right text-xs text-muted-foreground">
                        {t.vehicle.regNumber} / {t.driver.name}
                      </span>
                    </div>

                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      {t.source}
                      <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                      {t.destination}
                    </p>

                    <div className="flex items-center justify-between">
                      <StatusBadge meta={TRIP_STATUS_META[t.status]} />
                      <span className="text-xs text-muted-foreground">
                        {metaLabel(t)}
                      </span>
                    </div>
                  </div>

                  {canAct && (
                    <div className="mt-3 border-t border-border pt-2">
                      <TripRowActions
                        id={t.id}
                        status={t.status}
                        startOdometer={t.startOdometer}
                        regNumber={t.vehicle.regNumber}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
