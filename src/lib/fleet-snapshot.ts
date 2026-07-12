import "server-only";
import { db } from "@/lib/db";
import { vehicleEconomics } from "@/lib/reports";
import { getSimpleDashboardKPIs, getAttentionPanel } from "@/lib/dashboard";

/**
 * Compact JSON snapshot of the entire live fleet state.
 * Small enough to fit in a single LLM prompt (tens of rows).
 * context.md §7A — this is why RAG is unnecessary.
 */
export async function getFleetSnapshot() {
  const [kpis, attention, economics, vehicles, drivers, activeTrips, recentMaintenance, recentFuel] =
    await Promise.all([
      getSimpleDashboardKPIs(),
      getAttentionPanel(),
      vehicleEconomics(),
      db.vehicle.findMany({
        orderBy: { regNumber: "asc" },
        select: {
          regNumber: true,
          name: true,
          type: true,
          status: true,
          odometerKm: true,
          maxLoadKg: true,
          acquisitionCost: true,
        },
      }),
      db.driver.findMany({
        orderBy: { name: "asc" },
        select: {
          name: true,
          status: true,
          licenseExpiry: true,
          safetyScore: true,
          licenseCategory: true,
          licenseNumber: true,
        },
      }),
      db.trip.findMany({
        where: { status: "dispatched" },
        select: {
          source: true,
          destination: true,
          cargoWeightKg: true,
          plannedDistanceKm: true,
          vehicle: { select: { regNumber: true } },
          driver: { select: { name: true } },
        },
        orderBy: { dispatchedAt: "desc" },
      }),
      db.maintenanceLog.findMany({
        orderBy: { openedAt: "desc" },
        take: 10,
        select: {
          description: true,
          cost: true,
          status: true,
          openedAt: true,
          vehicle: { select: { regNumber: true } },
        },
      }),
      db.fuelLog.findMany({
        orderBy: { date: "desc" },
        take: 10,
        select: {
          liters: true,
          cost: true,
          date: true,
          vehicle: { select: { regNumber: true } },
        },
      }),
    ]);

  return {
    snapshotTime: new Date().toISOString(),
    kpis,
    attention: {
      expiringLicenses: attention.expiringLicenses,
      inShopVehicles: attention.inShopVehicles,
      draftTrips: attention.draftTrips,
    },
    vehicles: vehicles.map((v) => ({
      reg: v.regNumber,
      name: v.name,
      type: v.type,
      status: v.status,
      odometerKm: v.odometerKm,
      maxLoadKg: v.maxLoadKg,
      acquisitionCost: v.acquisitionCost,
    })),
    drivers: drivers.map((d) => ({
      name: d.name,
      status: d.status,
      licenseExpiry: d.licenseExpiry.toISOString().slice(0, 10),
      safetyScore: d.safetyScore,
      licenseCategory: d.licenseCategory,
    })),
    activeTrips: activeTrips.map((t) => ({
      vehicle: t.vehicle.regNumber,
      driver: t.driver.name,
      route: `${t.source} → ${t.destination}`,
      cargoKg: t.cargoWeightKg,
      plannedKm: t.plannedDistanceKm,
    })),
    recentMaintenance: recentMaintenance.map((m) => ({
      vehicle: m.vehicle.regNumber,
      description: m.description,
      cost: m.cost,
      status: m.status,
      openedAt: m.openedAt.toISOString().slice(0, 10),
    })),
    recentFuel: recentFuel.map((f) => ({
      vehicle: f.vehicle.regNumber,
      liters: f.liters,
      cost: f.cost,
      date: f.date.toISOString().slice(0, 10),
    })),
    perVehicleCosts: economics.map((e) => ({
      reg: e.regNumber,
      distanceKm: e.distanceKm,
      fuelL: e.fuelL,
      kmPerL: e.kmPerL != null ? +e.kmPerL.toFixed(2) : null,
      fuelCost: e.fuelCost,
      maintenanceCost: e.maintenanceCost,
      expenseCost: e.expenseCost,
      operationalCost: e.operationalCost,
      revenue: e.revenue,
      roiPct: e.roiPct != null ? +e.roiPct.toFixed(2) : null,
    })),
  };
}
