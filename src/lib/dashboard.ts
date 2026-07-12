import "server-only";
import { db } from "@/lib/db";
import type { VehicleType, VehicleStatus } from "@/generated/prisma/enums";

/* ─── KPI types ─── */
export type DashboardKPIs = {
  activeVehicles: number;
  availableVehicles: number;
  inMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilization: number; // percentage
};

export type AttentionItem = { id: string; label: string; detail: string };

export type AttentionPanel = {
  expiringLicenses: AttentionItem[];
  inShopVehicles: AttentionItem[];
  draftTrips: AttentionItem[];
};


/* ─── KPI computation ─── */

export async function getSimpleDashboardKPIs(filters?: {
  type?: VehicleType;
  status?: VehicleStatus;
}): Promise<DashboardKPIs> {
  const vWhere: { type?: VehicleType; status?: VehicleStatus } = {};
  if (filters?.type) vWhere.type = filters.type;
  // status filter is used only as a view filter, we still compute all KPIs

  // Fetch vehicle counts grouped by status (optionally filtered by type)
  const typeFilter: { type?: VehicleType } = {};
  if (filters?.type) typeFilter.type = filters.type;

  const vehicleGroups = await db.vehicle.groupBy({
    by: ["status"],
    _count: true,
    where: typeFilter,
  });

  const vehicleCountByStatus: Record<string, number> = {};
  for (const g of vehicleGroups) {
    vehicleCountByStatus[g.status] = g._count;
  }

  const available = vehicleCountByStatus["available"] ?? 0;
  const onTrip = vehicleCountByStatus["on_trip"] ?? 0;
  const inShop = vehicleCountByStatus["in_shop"] ?? 0;
  const retired = vehicleCountByStatus["retired"] ?? 0;
  const total = available + onTrip + inShop + retired;
  const nonRetired = total - retired;

  const [activeTrips, pendingTrips, driversOnDuty] = await Promise.all([
    db.trip.count({ where: { status: "dispatched" } }),
    db.trip.count({ where: { status: "draft" } }),
    db.driver.count({ where: { status: "on_trip" } }),
  ]);

  return {
    activeVehicles: nonRetired,
    availableVehicles: available,
    inMaintenance: inShop,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    fleetUtilization: nonRetired > 0 ? (onTrip / nonRetired) * 100 : 0,
  };
}

/* ─── Attention panel ─── */

export async function getAttentionPanel(): Promise<AttentionPanel> {
  const now = new Date();
  const thirtyDaysFromNow = new Date(
    now.getTime() + 30 * 24 * 60 * 60 * 1000,
  );

  const [expiringDrivers, inShopVehicles, draftTrips] = await Promise.all([
    // Drivers with licenses expiring within 30 days OR already expired
    db.driver.findMany({
      where: {
        licenseExpiry: { lte: thirtyDaysFromNow },
        status: { not: "suspended" },
      },
      select: { id: true, name: true, licenseExpiry: true },
      orderBy: { licenseExpiry: "asc" },
    }),
    // Vehicles currently in shop
    db.vehicle.findMany({
      where: { status: "in_shop" },
      select: { id: true, regNumber: true, name: true },
      orderBy: { regNumber: "asc" },
    }),
    // Draft trips pending dispatch
    db.trip.findMany({
      where: { status: "draft" },
      select: {
        id: true,
        source: true,
        destination: true,
        vehicle: { select: { regNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const dayMs = 24 * 60 * 60 * 1000;

  return {
    expiringLicenses: expiringDrivers.map((d) => {
      const daysLeft = Math.ceil(
        (d.licenseExpiry.getTime() - now.getTime()) / dayMs,
      );
      const expired = daysLeft < 0;
      return {
        id: d.id,
        label: d.name,
        detail: expired
          ? `Expired ${Math.abs(daysLeft)}d ago`
          : `Expires in ${daysLeft}d`,
      };
    }),
    inShopVehicles: inShopVehicles.map((v) => ({
      id: v.id,
      label: v.regNumber,
      detail: v.name,
    })),
    draftTrips: draftTrips.map((t) => ({
      id: t.id,
      label: `${t.source} → ${t.destination}`,
      detail: t.vehicle.regNumber,
    })),
  };
}
