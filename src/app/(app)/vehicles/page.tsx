import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { VEHICLE_STATUS_META } from "@/lib/status";
import type { VehicleStatus, VehicleType } from "@/generated/prisma/enums";
import { StatusBadge } from "@/components/app/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VehicleFilters } from "./filters";
import { VehicleDialog } from "./vehicle-dialog";
import { RetireVehicleButton } from "./retire-vehicle-button";

const rupees = new Intl.NumberFormat("en-IN");
const km = new Intl.NumberFormat("en-IN");

const VEHICLE_TYPES = ["truck", "van", "mini", "bike"];
const VEHICLE_STATUSES = ["available", "on_trip", "in_shop", "retired"];

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>;
}) {
  const session = await getSession();
  const canManage = session?.role === "fleet_manager";
  const { type, status } = await searchParams;

  const where: { type?: VehicleType; status?: VehicleStatus } = {};
  if (type && VEHICLE_TYPES.includes(type)) where.type = type as VehicleType;
  if (status && VEHICLE_STATUSES.includes(status))
    where.status = status as VehicleStatus;

  const vehicles = await db.vehicle.findMany({
    where,
    orderBy: { regNumber: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Vehicles</h1>
          <p className="text-sm text-muted-foreground">
            {vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"} in the
            fleet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <VehicleFilters />
          {canManage && <VehicleDialog />}
        </div>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reg No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Capacity</TableHead>
              <TableHead className="text-right">Odometer</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 8 : 7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No vehicles match these filters.
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="data font-medium">
                    {v.regNumber}
                  </TableCell>
                  <TableCell>{v.name}</TableCell>
                  <TableCell className="capitalize">{v.type}</TableCell>
                  <TableCell className="data text-right">
                    {km.format(v.maxLoadKg)} kg
                  </TableCell>
                  <TableCell className="data text-right">
                    {km.format(v.odometerKm)} km
                  </TableCell>
                  <TableCell className="data text-right">
                    ₹{rupees.format(v.acquisitionCost)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge meta={VEHICLE_STATUS_META[v.status]} />
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <VehicleDialog vehicle={v} />
                        {v.status !== "retired" && (
                          <RetireVehicleButton id={v.id} />
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
