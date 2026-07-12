import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { availableVehicles, availableDrivers } from "@/lib/dispatch-pool";
import { TRIP_STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/app/status-badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TripForm } from "./trip-form";
import { TripRowActions } from "./trip-actions";

const km = new Intl.NumberFormat("en-IN");

export default async function TripsPage() {
  const session = await getSession();
  const canAct = session?.role === "driver" || session?.role === "fleet_manager";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Trips</h1>
        <p className="text-sm text-muted-foreground">
          Dispatch board — {trips.length} trip{trips.length === 1 ? "" : "s"}
        </p>
      </div>

      <div
        className={cn(
          "grid gap-6",
          canAct ? "lg:grid-cols-[minmax(320px,380px)_1fr]" : "grid-cols-1",
        )}
      >
        {canAct && (
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>New trip</CardTitle>
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

        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead className="text-right">Cargo</TableHead>
                <TableHead className="text-right">Distance</TableHead>
                <TableHead>Status</TableHead>
                {canAct && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canAct ? 7 : 6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No trips yet — create one.
                  </TableCell>
                </TableRow>
              ) : (
                trips.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5">
                        {t.source}
                        <ArrowRight className="size-3 text-muted-foreground" />
                        {t.destination}
                      </span>
                    </TableCell>
                    <TableCell className="data">{t.vehicle.regNumber}</TableCell>
                    <TableCell>{t.driver.name}</TableCell>
                    <TableCell className="data text-right">
                      {km.format(t.cargoWeightKg)} kg
                    </TableCell>
                    <TableCell className="data text-right">
                      {km.format(t.plannedDistanceKm)} km
                    </TableCell>
                    <TableCell>
                      <StatusBadge meta={TRIP_STATUS_META[t.status]} />
                    </TableCell>
                    {canAct && (
                      <TableCell className="text-right">
                        <TripRowActions
                          id={t.id}
                          status={t.status}
                          startOdometer={t.startOdometer}
                          regNumber={t.vehicle.regNumber}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
