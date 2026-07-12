import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { vehicleEconomics } from "@/lib/reports";
import { VEHICLE_STATUS_META, TRIP_STATUS_META } from "@/lib/status";
import { StatusBadge } from "@/components/app/status-badge";
import { VehicleHealthCard } from "./vehicle-health-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const rupees = new Intl.NumberFormat("en-IN");
const num = new Intl.NumberFormat("en-IN");
const date = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`data mt-1 text-xl font-semibold ${accent ?? ""}`}>
        {value}
      </p>
    </div>
  );
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const vehicle = await db.vehicle.findUnique({
    where: { id },
    include: {
      trips: {
        orderBy: { createdAt: "desc" },
        include: { driver: { select: { name: true } } },
      },
      maintenanceLogs: { orderBy: { openedAt: "desc" } },
      fuelLogs: { orderBy: { date: "desc" } },
      expenses: { orderBy: { date: "desc" } },
    },
  });

  if (!vehicle) notFound();

  const econ = (await vehicleEconomics()).find((e) => e.vehicleId === id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/vehicles"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Vehicles
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="data text-2xl font-semibold">{vehicle.regNumber}</h1>
          <span className="text-muted-foreground">{vehicle.name}</span>
          <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
            {vehicle.type}
          </span>
          <StatusBadge meta={VEHICLE_STATUS_META[vehicle.status]} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Odometer" value={`${num.format(vehicle.odometerKm)} km`} />
        <Stat label="Capacity" value={`${num.format(vehicle.maxLoadKg)} kg`} />
        <Stat
          label="Acquisition"
          value={`₹${rupees.format(vehicle.acquisitionCost)}`}
        />
        <Stat
          label="Operational cost"
          value={`₹${rupees.format(econ?.operationalCost ?? 0)}`}
        />
        <Stat
          label="Efficiency"
          value={econ?.kmPerL != null ? `${econ.kmPerL.toFixed(1)} km/L` : "—"}
        />
        <Stat
          label="ROI"
          value={econ?.roiPct != null ? `${econ.roiPct.toFixed(0)}%` : "—"}
          accent={
            econ?.roiPct != null
              ? econ.roiPct >= 0
                ? "text-status-available"
                : "text-status-error"
              : undefined
          }
        />
      </div>

      <VehicleHealthCard vehicleId={vehicle.id} />

      {/* Trips */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Trips ({vehicle.trips.length})
        </h2>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead className="text-right">Cargo</TableHead>
                <TableHead className="text-right">Distance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicle.trips.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-16 text-center text-muted-foreground"
                  >
                    No trips.
                  </TableCell>
                </TableRow>
              ) : (
                vehicle.trips.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5">
                        {t.source}
                        <ArrowRight className="size-3 text-muted-foreground" />
                        {t.destination}
                      </span>
                    </TableCell>
                    <TableCell>{t.driver.name}</TableCell>
                    <TableCell className="data text-right">
                      {num.format(t.cargoWeightKg)} kg
                    </TableCell>
                    <TableCell className="data text-right">
                      {num.format(t.plannedDistanceKm)} km
                    </TableCell>
                    <TableCell>
                      <StatusBadge meta={TRIP_STATUS_META[t.status]} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Maintenance */}
        <section className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Maintenance ({vehicle.maintenanceLogs.length})
          </h2>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicle.maintenanceLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-16 text-center text-muted-foreground"
                    >
                      No maintenance logs.
                    </TableCell>
                  </TableRow>
                ) : (
                  vehicle.maintenanceLogs.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.description}</TableCell>
                      <TableCell className="data text-right">
                        ₹{rupees.format(m.cost)}
                      </TableCell>
                      <TableCell className="data">
                        {date.format(m.openedAt)}
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {m.status}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Fuel + Expenses */}
        <section className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Fuel logs ({vehicle.fuelLogs.length})
          </h2>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Liters</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicle.fuelLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-16 text-center text-muted-foreground"
                    >
                      No fuel logs.
                    </TableCell>
                  </TableRow>
                ) : (
                  vehicle.fuelLogs.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="data">
                        {date.format(f.date)}
                      </TableCell>
                      <TableCell className="data text-right">
                        {f.liters} L
                      </TableCell>
                      <TableCell className="data text-right">
                        ₹{rupees.format(f.cost)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  );
}
